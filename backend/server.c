/**
 * @file server.c
 * @brief Cross-platform C HTTP REST Server for Singly Linked List Project
 * 
 * Provides:
 * 1. Static file hosting for the web frontend (index.html, style.css, script.js)
 * 2. REST API endpoints connecting the UI to the pure C linked-list engine
 * 
 * Compiles on Windows (Winsock2) and Linux / macOS (POSIX sockets).
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <ctype.h>
#include "linkedlist.h"

#ifdef _WIN32
    #include <winsock2.h>
    #include <ws2tcpip.h>
    #ifdef _MSC_VER
    #pragma comment(lib, "ws2_32.lib")
    #endif
    typedef SOCKET socket_t;
    #define CLOSE_SOCKET(s) closesocket(s)
#else
    #include <sys/socket.h>
    #include <netinet/in.h>
    #include <arpa/inet.h>
    #include <unistd.h>
    typedef int socket_t;
    #define INVALID_SOCKET -1
    #define SOCKET_ERROR -1
    #define CLOSE_SOCKET(s) close(s)
#endif

#define PORT 8080
#define BUFFER_SIZE 65536
#define MAX_NODES 2048

/* Global head pointer for the singly linked list */
static struct Node* g_head = NULL;

/* Helper to initialize socket subsystem */
static int init_sockets(void) {
#ifdef _WIN32
    WSADATA wsa;
    return (WSAStartup(MAKEWORD(2, 2), &wsa) == 0);
#else
    return 1;
#endif
}

/* Helper to cleanup socket subsystem */
static void cleanup_sockets(void) {
#ifdef _WIN32
    WSACleanup();
#endif
}

/* Simple helper to extract an integer value for a given key from simple JSON */
static int extract_json_int(const char* json, const char* key, int* out_value) {
    if (!json || !key || !out_value) return 0;
    
    char pattern[128];
    snprintf(pattern, sizeof(pattern), "\"%s\"", key);
    
    const char* pos = strstr(json, pattern);
    if (!pos) return 0;

    pos += strlen(pattern);
    while (*pos && (*pos == ' ' || *pos == '\t' || *pos == ':')) {
        pos++;
    }

    if (*pos == '-' || isdigit((unsigned char)*pos)) {
        *out_value = atoi(pos);
        return 1;
    }
    return 0;
}

/* Builds a JSON payload representing the current linked list */
static int build_list_json(char* buffer, size_t max_len, int success, const char* message) {
    int arr[MAX_NODES];
    int count = toArray(g_head, arr, MAX_NODES);

    int offset = snprintf(buffer, max_len,
        "{\"success\": %s, \"count\": %d, \"message\": \"%s\", \"data\": [",
        success ? "true" : "false", count, message ? message : "");

    for (int i = 0; i < count; i++) {
        offset += snprintf(buffer + offset, max_len - offset, "%d%s", arr[i], (i + 1 < count) ? ", " : "");
    }
    offset += snprintf(buffer + offset, max_len - offset, "]}");
    return offset;
}

/* Sends an HTTP response with CORS headers */
static void send_response(socket_t client, int status_code, const char* status_text, 
                          const char* content_type, const char* body, size_t body_len) {
    char header[1024];
    int header_len = snprintf(header, sizeof(header),
        "HTTP/1.1 %d %s\r\n"
        "Server: SinglyLinkedList-CServer/1.0\r\n"
        "Content-Type: %s\r\n"
        "Content-Length: %zu\r\n"
        "Access-Control-Allow-Origin: *\r\n"
        "Access-Control-Allow-Methods: GET, POST, OPTIONS\r\n"
        "Access-Control-Allow-Headers: Content-Type\r\n"
        "Connection: close\r\n"
        "\r\n",
        status_code, status_text, content_type, body_len);

    send(client, header, header_len, 0);
    if (body && body_len > 0) {
        send(client, body, (int)body_len, 0);
    }
}

/* Helper to serve static files from disk */
static int serve_file(socket_t client, const char* relative_path, const char* content_type) {
    char alt_path1[256];
    char alt_path2[256];
    snprintf(alt_path1, sizeof(alt_path1), "../%s", relative_path);
    snprintf(alt_path2, sizeof(alt_path2), "./frontend/%s", relative_path + (strncmp(relative_path, "frontend/", 9) == 0 ? 9 : 0));

    const char* try_paths[] = { relative_path, alt_path1, alt_path2, NULL };
    FILE* f = NULL;

    for (int i = 0; try_paths[i] != NULL; i++) {
        f = fopen(try_paths[i], "rb");
        if (f) break;
    }

    if (!f) {
        const char* not_found = "{\"error\": \"File not found\"}";
        send_response(client, 404, "Not Found", "application/json", not_found, strlen(not_found));
        return 0;
    }

    fseek(f, 0, SEEK_END);
    long file_size = ftell(f);
    fseek(f, 0, SEEK_SET);

    char* file_buf = (char*)malloc(file_size + 1);
    if (!file_buf) {
        fclose(f);
        return 0;
    }

    size_t read_bytes = fread(file_buf, 1, file_size, f);
    file_buf[read_bytes] = '\0';
    fclose(f);

    send_response(client, 200, "OK", content_type, file_buf, read_bytes);
    free(file_buf);
    return 1;
}

/* Handles incoming HTTP requests */
static void handle_request(socket_t client, char* request) {
    char method[16] = {0};
    char path[256] = {0};

    if (sscanf(request, "%15s %255s", method, path) < 2) {
        const char* bad = "{\"error\": \"Bad Request\"}";
        send_response(client, 400, "Bad Request", "application/json", bad, strlen(bad));
        return;
    }

    /* Locate HTTP request body (after \r\n\r\n) */
    char* body = strstr(request, "\r\n\r\n");
    if (body) {
        body += 4;
    } else {
        body = "";
    }

    /* CORS preflight OPTIONS */
    if (strcmp(method, "OPTIONS") == 0) {
        send_response(client, 204, "No Content", "text/plain", "", 0);
        return;
    }

    /* Route Static Files */
    if (strcmp(method, "GET") == 0) {
        if (strcmp(path, "/") == 0 || strcmp(path, "/index.html") == 0) {
            serve_file(client, "frontend/index.html", "text/html; charset=utf-8");
            return;
        } else if (strcmp(path, "/style.css") == 0 || strcmp(path, "/frontend/style.css") == 0) {
            serve_file(client, "frontend/style.css", "text/css; charset=utf-8");
            return;
        } else if (strcmp(path, "/script.js") == 0 || strcmp(path, "/frontend/script.js") == 0) {
            serve_file(client, "frontend/script.js", "application/javascript; charset=utf-8");
            return;
        }
    }

    /* Route REST API Endpoints */
    char json_resp[BUFFER_SIZE];

    /* 1. GET /api/list */
    if (strcmp(method, "GET") == 0 && strcmp(path, "/api/list") == 0) {
        build_list_json(json_resp, sizeof(json_resp), 1, "List fetched successfully");
        send_response(client, 200, "OK", "application/json", json_resp, strlen(json_resp));
        return;
    }

    /* 2. POST /api/insert/beginning */
    if (strcmp(method, "POST") == 0 && strcmp(path, "/api/insert/beginning") == 0) {
        int val = 0;
        if (!extract_json_int(body, "value", &val)) {
            const char* err = "{\"success\": false, \"message\": \"Missing 'value' integer in request payload\"}";
            send_response(client, 400, "Bad Request", "application/json", err, strlen(err));
            return;
        }
        insertBeginning(&g_head, val);
        char msg[128];
        snprintf(msg, sizeof(msg), "Node %d inserted successfully at beginning", val);
        build_list_json(json_resp, sizeof(json_resp), 1, msg);
        send_response(client, 200, "OK", "application/json", json_resp, strlen(json_resp));
        return;
    }

    /* 3. POST /api/insert/end */
    if (strcmp(method, "POST") == 0 && strcmp(path, "/api/insert/end") == 0) {
        int val = 0;
        if (!extract_json_int(body, "value", &val)) {
            const char* err = "{\"success\": false, \"message\": \"Missing 'value' integer in request payload\"}";
            send_response(client, 400, "Bad Request", "application/json", err, strlen(err));
            return;
        }
        insertEnd(&g_head, val);
        char msg[128];
        snprintf(msg, sizeof(msg), "Node %d inserted successfully at end", val);
        build_list_json(json_resp, sizeof(json_resp), 1, msg);
        send_response(client, 200, "OK", "application/json", json_resp, strlen(json_resp));
        return;
    }

    /* 4. POST /api/insert/position */
    if (strcmp(method, "POST") == 0 && strcmp(path, "/api/insert/position") == 0) {
        int val = 0, pos = 0;
        if (!extract_json_int(body, "value", &val) || !extract_json_int(body, "position", &pos)) {
            const char* err = "{\"success\": false, \"message\": \"Missing 'value' or 'position' in payload\"}";
            send_response(client, 400, "Bad Request", "application/json", err, strlen(err));
            return;
        }
        int ok = insertAtPosition(&g_head, val, pos);
        char msg[128];
        if (ok) {
            snprintf(msg, sizeof(msg), "Node %d inserted successfully at position %d", val, pos);
            build_list_json(json_resp, sizeof(json_resp), 1, msg);
        } else {
            int currentCount = countNodes(g_head);
            snprintf(msg, sizeof(msg), "Invalid position %d! Allowed position range: 1 to %d", pos, currentCount + 1);
            build_list_json(json_resp, sizeof(json_resp), 0, msg);
        }
        send_response(client, 200, "OK", "application/json", json_resp, strlen(json_resp));
        return;
    }

    /* 5. POST /api/delete/beginning */
    if (strcmp(method, "POST") == 0 && strcmp(path, "/api/delete/beginning") == 0) {
        int deletedVal = 0;
        int ok = deleteBeginning(&g_head, &deletedVal);
        char msg[128];
        if (ok) {
            snprintf(msg, sizeof(msg), "Node %d deleted successfully from beginning", deletedVal);
            build_list_json(json_resp, sizeof(json_resp), 1, msg);
        } else {
            snprintf(msg, sizeof(msg), "Cannot delete from empty linked list!");
            build_list_json(json_resp, sizeof(json_resp), 0, msg);
        }
        send_response(client, 200, "OK", "application/json", json_resp, strlen(json_resp));
        return;
    }

    /* 6. POST /api/delete/end */
    if (strcmp(method, "POST") == 0 && strcmp(path, "/api/delete/end") == 0) {
        int deletedVal = 0;
        int ok = deleteEnd(&g_head, &deletedVal);
        char msg[128];
        if (ok) {
            snprintf(msg, sizeof(msg), "Node %d deleted successfully from end", deletedVal);
            build_list_json(json_resp, sizeof(json_resp), 1, msg);
        } else {
            snprintf(msg, sizeof(msg), "Cannot delete from empty linked list!");
            build_list_json(json_resp, sizeof(json_resp), 0, msg);
        }
        send_response(client, 200, "OK", "application/json", json_resp, strlen(json_resp));
        return;
    }

    /* 7. POST /api/delete/position */
    if (strcmp(method, "POST") == 0 && strcmp(path, "/api/delete/position") == 0) {
        int pos = 0;
        if (!extract_json_int(body, "position", &pos)) {
            const char* err = "{\"success\": false, \"message\": \"Missing 'position' in payload\"}";
            send_response(client, 400, "Bad Request", "application/json", err, strlen(err));
            return;
        }
        int deletedVal = 0;
        int ok = deleteAtPosition(&g_head, pos, &deletedVal);
        char msg[128];
        if (ok) {
            snprintf(msg, sizeof(msg), "Node %d deleted successfully from position %d", deletedVal, pos);
            build_list_json(json_resp, sizeof(json_resp), 1, msg);
        } else {
            int currentCount = countNodes(g_head);
            snprintf(msg, sizeof(msg), "Invalid position %d! Current valid positions: 1 to %d", pos, currentCount);
            build_list_json(json_resp, sizeof(json_resp), 0, msg);
        }
        send_response(client, 200, "OK", "application/json", json_resp, strlen(json_resp));
        return;
    }

    /* 8. POST /api/search */
    if (strcmp(method, "POST") == 0 && strcmp(path, "/api/search") == 0) {
        int val = 0;
        if (!extract_json_int(body, "value", &val)) {
            const char* err = "{\"success\": false, \"message\": \"Missing 'value' in payload\"}";
            send_response(client, 400, "Bad Request", "application/json", err, strlen(err));
            return;
        }
        int pos = searchNode(g_head, val);
        char msg[128];
        if (pos > 0) {
            snprintf(msg, sizeof(msg), "Node %d found at position %d", val, pos);
            snprintf(json_resp, sizeof(json_resp),
                "{\"success\": true, \"found\": true, \"value\": %d, \"position\": %d, \"message\": \"%s\"}",
                val, pos, msg);
        } else {
            snprintf(msg, sizeof(msg), "Node %d not found in the linked list", val);
            snprintf(json_resp, sizeof(json_resp),
                "{\"success\": true, \"found\": false, \"value\": %d, \"position\": 0, \"message\": \"%s\"}",
                val, msg);
        }
        send_response(client, 200, "OK", "application/json", json_resp, strlen(json_resp));
        return;
    }

    /* 9. GET /api/count */
    if (strcmp(method, "GET") == 0 && strcmp(path, "/api/count") == 0) {
        int cnt = countNodes(g_head);
        char msg[128];
        snprintf(msg, sizeof(msg), "Total number of nodes: %d", cnt);
        snprintf(json_resp, sizeof(json_resp),
            "{\"success\": true, \"count\": %d, \"message\": \"%s\"}", cnt, msg);
        send_response(client, 200, "OK", "application/json", json_resp, strlen(json_resp));
        return;
    }

    /* 10. POST /api/reverse */
    if (strcmp(method, "POST") == 0 && strcmp(path, "/api/reverse") == 0) {
        reverseList(&g_head);
        build_list_json(json_resp, sizeof(json_resp), 1, "Linked list reversed successfully");
        send_response(client, 200, "OK", "application/json", json_resp, strlen(json_resp));
        return;
    }

    /* 11. POST /api/clear */
    if (strcmp(method, "POST") == 0 && strcmp(path, "/api/clear") == 0) {
        clearList(&g_head);
        build_list_json(json_resp, sizeof(json_resp), 1, "Linked list cleared successfully (All memory freed)");
        send_response(client, 200, "OK", "application/json", json_resp, strlen(json_resp));
        return;
    }

    /* Unknown Route */
    const char* not_found = "{\"error\": \"Endpoint not found\"}";
    send_response(client, 404, "Not Found", "application/json", not_found, strlen(not_found));
}

int main(void) {
    if (!init_sockets()) {
        fprintf(stderr, "Failed to initialize socket library.\n");
        return 1;
    }

    socket_t server_fd = socket(AF_INET, SOCK_STREAM, 0);
    if (server_fd == INVALID_SOCKET) {
        fprintf(stderr, "Socket creation failed.\n");
        cleanup_sockets();
        return 1;
    }

    /* Allow socket address reuse */
    int opt = 1;
#ifdef _WIN32
    setsockopt(server_fd, SOL_SOCKET, SO_REUSEADDR, (const char*)&opt, sizeof(opt));
#else
    setsockopt(server_fd, SOL_SOCKET, SO_REUSEADDR, &opt, sizeof(opt));
#endif

    struct sockaddr_in address;
    memset(&address, 0, sizeof(address));
    address.sin_family = AF_INET;
    address.sin_addr.s_addr = INADDR_ANY;
    address.sin_port = htons(PORT);

    if (bind(server_fd, (struct sockaddr*)&address, sizeof(address)) == SOCKET_ERROR) {
        fprintf(stderr, "Bind failed on port %d. Please make sure no other server is using this port.\n", PORT);
        CLOSE_SOCKET(server_fd);
        cleanup_sockets();
        return 1;
    }

    if (listen(server_fd, 10) == SOCKET_ERROR) {
        fprintf(stderr, "Listen failed.\n");
        CLOSE_SOCKET(server_fd);
        cleanup_sockets();
        return 1;
    }

    /* Initialize with some starter nodes so the visualizer looks great on first launch */
    insertEnd(&g_head, 10);
    insertEnd(&g_head, 20);
    insertEnd(&g_head, 30);
    insertEnd(&g_head, 40);

    printf("=========================================================\n");
    printf("   SINGLY LINKED LIST IMPLEMENTATION - C HTTP SERVER   \n");
    printf("=========================================================\n");
    printf(" Server listening at: http://localhost:%d/\n", PORT);
    printf(" Initial list state : ");
    displayList(g_head);
    printf(" Open http://localhost:%d in your web browser!\n", PORT);
    printf(" Press Ctrl+C in terminal to stop server.\n");
    printf("=========================================================\n\n");

    char buffer[BUFFER_SIZE];

    while (1) {
        struct sockaddr_in client_addr;
        int addr_len = sizeof(client_addr);
        socket_t client_fd = accept(server_fd, (struct sockaddr*)&client_addr, &addr_len);

        if (client_fd == INVALID_SOCKET) {
            continue;
        }

        int total_read = 0;
        while (total_read < (int)sizeof(buffer) - 1) {
            int bytes_read = recv(client_fd, buffer + total_read, (int)(sizeof(buffer) - 1 - total_read), 0);
            if (bytes_read <= 0) break;
            total_read += bytes_read;
            buffer[total_read] = '\0';

            char* header_end = strstr(buffer, "\r\n\r\n");
            if (header_end) {
                char* cl = strstr(buffer, "Content-Length:");
                if (!cl) cl = strstr(buffer, "content-length:");
                if (cl) {
                    int content_len = atoi(cl + 15);
                    int body_received = total_read - (int)(header_end + 4 - buffer);
                    if (body_received >= content_len) {
                        break;
                    }
                } else {
                    break;
                }
            }
        }

        if (total_read > 0) {
            handle_request(client_fd, buffer);
        }

#ifdef _WIN32
        shutdown(client_fd, SD_BOTH);
#else
        shutdown(client_fd, SHUT_WR);
#endif
        CLOSE_SOCKET(client_fd);
    }

    /* Cleanup memory upon exit */
    clearList(&g_head);
    CLOSE_SOCKET(server_fd);
    cleanup_sockets();
    return 0;
}
