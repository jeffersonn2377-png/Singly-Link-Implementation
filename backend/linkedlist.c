/**
 * @file linkedlist.c
 * @brief Implementation of Singly Linked List Operations in C
 * 
 * Demonstrates node creation, insertions, deletions, searching, counting,
 * reversal, and memory cleanup using dynamic memory allocation (malloc/free).
 */

#include "linkedlist.h"

/**
 * @brief Allocates heap memory for a new Node and initializes its members.
 */
struct Node* createNode(int data) {
    struct Node* newNode = (struct Node*)malloc(sizeof(struct Node));
    if (newNode == NULL) {
        fprintf(stderr, "Error: Memory allocation failed!\n");
        return NULL;
    }
    newNode->data = data;
    newNode->next = NULL;
    return newNode;
}

/**
 * @brief Inserts a node at the beginning of the linked list.
 * Time Complexity: O(1)
 */
void insertBeginning(struct Node** head, int data) {
    struct Node* newNode = createNode(data);
    if (!newNode) return;

    newNode->next = *head;
    *head = newNode;
}

/**
 * @brief Inserts a node at the end (tail) of the linked list.
 * Time Complexity: O(n)
 */
void insertEnd(struct Node** head, int data) {
    struct Node* newNode = createNode(data);
    if (!newNode) return;

    // If list is empty, new node becomes the head
    if (*head == NULL) {
        *head = newNode;
        return;
    }

    // Traverse to the last node
    struct Node* current = *head;
    while (current->next != NULL) {
        current = current->next;
    }

    current->next = newNode;
}

/**
 * @brief Inserts a node at a specific 1-based position.
 * Position 1 corresponds to inserting at the beginning.
 * Position count+1 corresponds to inserting at the end.
 * Returns 1 on success, 0 on invalid position.
 * Time Complexity: O(n)
 */
int insertAtPosition(struct Node** head, int data, int position) {
    if (position < 1) {
        return 0; // Invalid position (1-based index required)
    }

    // Inserting at the beginning
    if (position == 1) {
        insertBeginning(head, data);
        return 1;
    }

    struct Node* current = *head;
    // Traverse to position - 1
    for (int i = 1; current != NULL && i < position - 1; i++) {
        current = current->next;
    }

    // If position is beyond current list length + 1
    if (current == NULL) {
        return 0;
    }

    struct Node* newNode = createNode(data);
    if (!newNode) return 0;

    newNode->next = current->next;
    current->next = newNode;
    return 1;
}

/**
 * @brief Deletes the first node of the list.
 * Time Complexity: O(1)
 * Returns 1 on success, 0 if list is empty.
 */
int deleteBeginning(struct Node** head, int* deletedVal) {
    if (*head == NULL) {
        return 0; // List is empty
    }

    struct Node* temp = *head;
    if (deletedVal) {
        *deletedVal = temp->data;
    }

    *head = (*head)->next;
    free(temp);
    return 1;
}

/**
 * @brief Deletes the last node of the list.
 * Time Complexity: O(n)
 * Returns 1 on success, 0 if list is empty.
 */
int deleteEnd(struct Node** head, int* deletedVal) {
    if (*head == NULL) {
        return 0; // List is empty
    }

    // Single node scenario
    if ((*head)->next == NULL) {
        if (deletedVal) {
            *deletedVal = (*head)->data;
        }
        free(*head);
        *head = NULL;
        return 1;
    }

    // Traverse to the second to last node
    struct Node* current = *head;
    while (current->next->next != NULL) {
        current = current->next;
    }

    struct Node* last = current->next;
    if (deletedVal) {
        *deletedVal = last->data;
    }
    current->next = NULL;
    free(last);
    return 1;
}

/**
 * @brief Deletes a node at a specified 1-based position.
 * Returns 1 on success, 0 if position is invalid or list is empty.
 * Time Complexity: O(n)
 */
int deleteAtPosition(struct Node** head, int position, int* deletedVal) {
    if (*head == NULL || position < 1) {
        return 0;
    }

    // Deleting the first node
    if (position == 1) {
        return deleteBeginning(head, deletedVal);
    }

    struct Node* current = *head;
    // Traverse to node just before the target node (position - 1)
    for (int i = 1; current != NULL && i < position - 1; i++) {
        current = current->next;
    }

    // If current is NULL or current->next is NULL, position is out of bounds
    if (current == NULL || current->next == NULL) {
        return 0;
    }

    struct Node* target = current->next;
    if (deletedVal) {
        *deletedVal = target->data;
    }
    current->next = target->next;
    free(target);
    return 1;
}

/**
 * @brief Searches for the first occurrence of a value.
 * Returns 1-based position if found, 0 if not found.
 * Time Complexity: O(n)
 */
int searchNode(struct Node* head, int key) {
    struct Node* current = head;
    int position = 1;

    while (current != NULL) {
        if (current->data == key) {
            return position;
        }
        current = current->next;
        position++;
    }

    return 0; // Not found
}

/**
 * @brief Counts the total number of nodes in the list.
 * Time Complexity: O(n)
 */
int countNodes(struct Node* head) {
    int count = 0;
    struct Node* current = head;
    while (current != NULL) {
        count++;
        current = current->next;
    }
    return count;
}

/**
 * @brief Reverses the links of the list iteratively in-place.
 * Time Complexity: O(n), Space Complexity: O(1)
 */
void reverseList(struct Node** head) {
    struct Node* prev = NULL;
    struct Node* current = *head;
    struct Node* next = NULL;

    while (current != NULL) {
        next = current->next;  // Store next node pointer
        current->next = prev;  // Reverse current node's pointer
        prev = current;        // Move prev forward
        current = next;        // Move current forward
    }

    *head = prev; // Update head to new front
}

/**
 * @brief Deallocates all nodes to prevent memory leaks and sets head to NULL.
 * Time Complexity: O(n)
 */
void clearList(struct Node** head) {
    struct Node* current = *head;
    struct Node* nextNode = NULL;

    while (current != NULL) {
        nextNode = current->next;
        free(current);
        current = nextNode;
    }

    *head = NULL;
}

/**
 * @brief Prints the list visually to stdout.
 */
void displayList(struct Node* head) {
    printf("HEAD");
    struct Node* current = head;
    while (current != NULL) {
        printf(" -> [%d]", current->data);
        current = current->next;
    }
    printf(" -> NULL\n");
}

/**
 * @brief Exports current linked list elements into an array.
 */
int toArray(struct Node* head, int* arr, int maxElements) {
    int count = 0;
    struct Node* current = head;
    while (current != NULL && count < maxElements) {
        arr[count++] = current->data;
        current = current->next;
    }
    return count;
}
