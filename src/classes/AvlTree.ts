type Comparator<T> = (a: T, b: T) => number;

class Node<T> {
    value: T;
    parent: Node<T> | null;
    left: Node<T> | null;
    right: Node<T> | null;
    height: number;
    count: number;

    constructor(value: T, parent: Node<T> | null = null) {
        this.value = value;
        this.parent = parent;
        this.left = null;
        this.right = null;
        this.height = 1;
        this.count = 1;
    }

    isRightChild(): boolean {
        return !!this.parent && this.parent.right === this;
    }

    isLeftChild(): boolean {
        return !!this.parent && this.parent.left === this;
    }
}

export class AvlTree<T> {
    root: Node<T> | null;
    comparator: Comparator<T>;
    minNode: Node<T> | null;
    maxNode: Node<T> | null;
    teamId: number | undefined;

    constructor(comparator: Comparator<T> = AvlTree.defaultComparator) {
        this.root = null;
        this.comparator = comparator;
        this.minNode = null;
        this.maxNode = null;
    }

    static defaultComparator<T>(a: T, b: T): number {
        const aStr = String(a);
        const bStr = String(b);
        return aStr < bStr ? -1 : aStr > bStr ? 1 : 0;
    }

    add(value: T): boolean {
        if (this.root === null) {
            this.root = new Node(value);
            this.minNode = this.root;
            this.maxNode = this.root;
            return true;
        }

        let newNode: Node<T> | null = null;

        this.traverse_((node) => {
            let nextNode: Node<T> | null = null;

            if (this.comparator(node.value, value) > 0) {
                if (node.left === null) {
                    newNode = new Node(value, node);
                    node.left = newNode;
                    if (node === this.minNode) {
                        this.minNode = newNode;
                    }
                }
                nextNode = node.left;
            } else if (this.comparator(node.value, value) < 0) {
                if (node.right === null) {
                    newNode = new Node(value, node);
                    node.right = newNode;
                    if (node === this.maxNode) {
                        this.maxNode = newNode;
                    }
                }
                nextNode = node.right;
            }

            return nextNode;
        });

        if (newNode !== null) {
            this.traverse_((node) => {
                node.count++;
                return node.parent;
            }, newNode.parent);

            this.balance_(newNode.parent);
        }

        return newNode !== null;
    }

    remove(value: T): T | null {
        let removedValue: T | null = null;

        this.traverse_((node) => {
            let nextNode: Node<T> | null = null;

            if (this.comparator(node.value, value) > 0) {
                nextNode = node.left;
            } else if (this.comparator(node.value, value) < 0) {
                nextNode = node.right;
            } else {
                removedValue = node.value;
                this.removeNode_(node);
            }

            return nextNode;
        });

        return removedValue;
    }

    clear(): void {
        this.root = null;
        this.minNode = null;
        this.maxNode = null;
    }

    contains(value: T): boolean {
        let found = false;

        this.traverse_((node) => {
            let nextNode: Node<T> | null = null;

            if (this.comparator(node.value, value) > 0) {
                nextNode = node.left;
            } else if (this.comparator(node.value, value) < 0) {
                nextNode = node.right;
            } else {
                found = true;
            }

            return nextNode;
        });

        return found;
    }

    private getCount_(node: Node<T> | null): number {
        return node ? node.count : 0;
    }

    getCount(): number {
        return this.getCount_(this.root);
    }

    getKthValue(index: number): T | null {
        if (this.root === null || index < 0 || index >= this.root.count) {
            return null;
        }

        const node = this.getKthNode_(index, this.root);
        return node ? node.value : null;
    }

    getMinimum(): T | null {
        return this.minNode ? this.minNode.value : null;
    }

    getMaximum(): T | null {
        return this.maxNode ? this.maxNode.value : null;
    }

    private getHeight_(node: Node<T> | null): number {
        return node ? node.height : 0;
    }

    getHeight(): number {
        return this.getHeight_(this.root);
    }

    getValues(): T[] {
        const values: T[] = [];
        this.inOrderTraverse((value: T) => {
            values.push(value);
        });
        return values;
    }

    inOrderTraverse(func: (value: T) => void, startValue?: T): void {
        let startNode: Node<T> | null = this.root;

        if (startValue !== undefined) {
            this.traverse_((node) => {
                let nextNode: Node<T> | null = null;

                if (this.comparator(node.value, startValue) > 0) {
                    nextNode = node.left;
                } else if (this.comparator(node.value, startValue) < 0) {
                    nextNode = node.right;
                } else {
                    startNode = node;
                }

                return nextNode;
            });
        }

        this.traverse_((node) => {
            func(node.value);
            return node.right;
        }, startNode);
    }

    reverseOrderTraverse(func: (value: T) => void, startValue?: T): void {
        let startNode: Node<T> | null = this.root;

        if (startValue !== undefined) {
            this.traverse_((node) => {
                let nextNode: Node<T> | null = null;

                if (this.comparator(node.value, startValue) > 0) {
                    nextNode = node.left;
                } else if (this.comparator(node.value, startValue) < 0) {
                    nextNode = node.right;
                } else {
                    startNode = node;
                }

                return nextNode;
            });
        }

        this.traverse_((node) => {
            func(node.value);
            return node.left;
        }, startNode);
    }

    private traverse_(func: (node: Node<T>) => Node<T> | null, startNode: Node<T> | null = this.root, endNode: Node<T> | null = null): void {
        let node: Node<T> | null = startNode;

        while (node !== null && node !== endNode) {
            const nextNode: Node<T> | null = func(node);

            if (nextNode === null) {
                break;
            }

            node = nextNode;
        }
    }

    private balance_(node: Node<T>): void {
        while (node !== null) {
            const balanceFactor = this.getBalanceFactor_(node);

            if (balanceFactor > 1) {
                if (this.getBalanceFactor_(node.left!) < 0) {
                    this.leftRotate_(node.left!);
                }
                this.rightRotate_(node);
            } else if (balanceFactor < -1) {
                if (this.getBalanceFactor_(node.right!) > 0) {
                    this.rightRotate_(node.right!);
                }
                this.leftRotate_(node);
            }

            node = node.parent;
        }
    }

    private getBalanceFactor_(node: Node<T>): number {
        const leftHeight = node.left ? node.left.height : 0;
        const rightHeight = node.right ? node.right.height : 0;
        return leftHeight - rightHeight;
    }

    private leftRotate_(node: Node<T>): void {
        const rightNode = node.right;
        node.right = rightNode!.left;

        if (rightNode!.left) {
            rightNode!.left.parent = node;
        }

        rightNode!.parent = node.parent;

        if (!node.parent) {
            this.root = rightNode;
        } else if (node === node.parent.left) {
            node.parent.left = rightNode;
        } else {
            node.parent.right = rightNode;
        }

        rightNode!.left = node;
        node.parent = rightNode;

        // Update heights
        node.height = Math.max(this.getHeight_(node.left), this.getHeight_(node.right)) + 1;
        rightNode!.height = Math.max(this.getHeight_(rightNode!.left), this.getHeight_(rightNode!.right)) + 1;

        // Update sizes
        node.count = this.getCount_(node.left) + this.getCount_(node.right) + 1;
        rightNode!.count = this.getCount_(rightNode!.left) + this.getCount_(rightNode!.right) + 1;
    }

    private rightRotate_(node: Node<T>): void {
        const leftNode = node.left;
        node.left = leftNode!.right;

        if (leftNode!.right) {
            leftNode!.right.parent = node;
        }

        leftNode!.parent = node.parent;

        if (!node.parent) {
            this.root = leftNode;
        } else if (node === node.parent.right) {
            node.parent.right = leftNode;
        } else {
            node.parent.left = leftNode;
        }

        leftNode!.right = node;
        node.parent = leftNode;

        // Update heights
        node.height = Math.max(this.getHeight_(node.left), this.getHeight_(node.right)) + 1;
        leftNode!.height = Math.max(this.getHeight_(leftNode!.left), this.getHeight_(leftNode!.right)) + 1;

        // Update sizes
        node.count = this.getCount_(node.left) + this.getCount_(node.right) + 1;
        leftNode!.count = this.getCount_(leftNode!.left) + this.getCount_(leftNode!.right) + 1;
    }

    private removeNode_(node: Node<T>): void {
        if (node.left && node.right) {
            const successor = this.getMinNode_(node.right);
            node.value = successor.value;
            this.removeNode_(successor);
        } else if (node.left) {
            this.replaceNodeInParent_(node, node.left);
        } else if (node.right) {
            this.replaceNodeInParent_(node, node.right);
        } else {
            this.replaceNodeInParent_(node, null);
        }
    }

    private replaceNodeInParent_(node: Node<T>, newNode: Node<T> | null): void {
        if (node.parent) {
            if (node === node.parent.left) {
                node.parent.left = newNode;
            } else {
                node.parent.right = newNode;
            }
        } else if (node === this.root) {
            this.root = newNode;
        }

        if (newNode) {
            newNode.parent = node.parent;
        }
    }

    private getKthNode_(index: number, startNode: Node<T> = this.root): Node<T> | null {
        let node = startNode;

        while (node) {
            const leftCount = this.getCount_(node.left);

            if (leftCount > index) {
                node = node.left;
            } else if (leftCount < index) {
                index -= leftCount + 1;
                node = node.right;
            } else {
                return node;
            }
        }

        return null;
    }

    private getMinNode_(startNode: Node<T> = this.root): Node<T> | null {
        let node = startNode;

        while (node && node.left) {
            node = node.left;
        }

        return node;
    }

    private getMaxNode_(startNode: Node<T> = this.root): Node<T> | null {
        let node = startNode;

        while (node && node.right) {
            node = node.right;
        }

        return node;
    }
}
