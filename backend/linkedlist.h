/**
 * @file linkedlist.h
 * @brief Header file for Singly Linked List Implementation
 * 
 * Provides definitions and function prototypes for standard singly linked list
 * operations using dynamic memory allocation in C.
 */

#ifndef LINKEDLIST_H
#define LINKEDLIST_H

#include <stdio.h>
#include <stdlib.h>

/**
 * @struct Node
 * @brief Represents a single element (node) in the singly linked list.
 */
struct Node {
    int data;           /**< Integer data held by the node */
    struct Node *next;  /**< Pointer to the next node in the sequence, or NULL if tail */
};

/* --- Node Creation --- */

/**
 * @brief Dynamically allocates memory for a new node with given data.
 * @param data The integer value to store in the node.
 * @return Pointer to the newly allocated Node, or NULL on allocation failure.
 */
struct Node* createNode(int data);

/* --- Insertion Operations --- */

/**
 * @brief Inserts a new node at the very beginning of the list (new HEAD).
 * @param head Pointer to the head pointer of the list.
 * @param data Value to be inserted.
 */
void insertBeginning(struct Node** head, int data);

/**
 * @brief Inserts a new node at the end of the list.
 * @param head Pointer to the head pointer of the list.
 * @param data Value to be inserted.
 */
void insertEnd(struct Node** head, int data);

/**
 * @brief Inserts a new node at a specified 1-based position.
 * @param head Pointer to the head pointer of the list.
 * @param data Value to be inserted.
 * @param position 1-based index (1 means new head, count+1 means at end).
 * @return 1 on success, 0 on invalid position.
 */
int insertAtPosition(struct Node** head, int data, int position);

/* --- Deletion Operations --- */

/**
 * @brief Deletes the first node (HEAD) of the list.
 * @param head Pointer to the head pointer of the list.
 * @param deletedVal Output pointer to store the value of the deleted node.
 * @return 1 on success, 0 if list was empty.
 */
int deleteBeginning(struct Node** head, int* deletedVal);

/**
 * @brief Deletes the last node of the list.
 * @param head Pointer to the head pointer of the list.
 * @param deletedVal Output pointer to store the value of the deleted node.
 * @return 1 on success, 0 if list was empty.
 */
int deleteEnd(struct Node** head, int* deletedVal);

/**
 * @brief Deletes a node at a specified 1-based position.
 * @param head Pointer to the head pointer of the list.
 * @param position 1-based index of the node to remove.
 * @param deletedVal Output pointer to store the value of the deleted node.
 * @return 1 on success, 0 on invalid position or empty list.
 */
int deleteAtPosition(struct Node** head, int position, int* deletedVal);

/* --- Traversal, Search & Utility Operations --- */

/**
 * @brief Searches for the first occurrence of a value in the list.
 * @param head Pointer to the first node of the list.
 * @param key The integer value to search for.
 * @return 1-based position of the node if found, or 0 if not found.
 */
int searchNode(struct Node* head, int key);

/**
 * @brief Counts the total number of nodes currently in the list.
 * @param head Pointer to the first node of the list.
 * @return Non-negative integer node count.
 */
int countNodes(struct Node* head);

/**
 * @brief Reverses the links of the list in-place (iterative approach).
 * @param head Pointer to the head pointer of the list.
 */
void reverseList(struct Node** head);

/**
 * @brief Deallocates all nodes in the list and resets HEAD to NULL.
 * @param head Pointer to the head pointer of the list.
 */
void clearList(struct Node** head);

/**
 * @brief Prints the linked list to stdout (e.g., HEAD -> [10] -> [20] -> NULL).
 * @param head Pointer to the first node of the list.
 */
void displayList(struct Node* head);

/**
 * @brief Exports current linked list elements into an array for serialization.
 * @param head Pointer to the first node of the list.
 * @param arr Output integer array buffer.
 * @param maxElements Capacity of the array buffer.
 * @return Actual number of elements copied.
 */
int toArray(struct Node* head, int* arr, int maxElements);

#endif /* LINKEDLIST_H */
