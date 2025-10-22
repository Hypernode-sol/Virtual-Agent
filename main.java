package com.hypernode;

import java.util.*;
import java.util.concurrent.*;

/**
 * hypernode (Power Flow Network) - Central Virtual Agent
 * 
 * This agent is responsible for managing the computational power flow within the Power Flow Network,
 * a distributed computing network. It coordinates connected machines, distributes tasks, monitors
 * performance, and ensures the integrity and efficiency of the network.
 */
public class hypernodeAgent {

    // Main data structures
    private final Map<String, MachineNode> nodes; // Network nodes (connected machines)
    private final Queue<Task> taskQueue;          // Queue of pending tasks
    private final ExecutorService executor;      // Executor to distribute tasks

    // Management philosophy
    private static final int MAX_TASK_RETRIES = 3; // Maximum number of retries for a task

    public hypernodeAgent() {
        this.nodes = new ConcurrentHashMap<>();
        this.taskQueue = new ConcurrentLinkedQueue<>();
        this.executor = Executors.newCachedThreadPool();
    }

    /**
     * Registers a new machine in the network.
     */
    public void registerNode(String nodeId, int capacity) {
        nodes.put(nodeId, new MachineNode(nodeId, capacity));
        System.out.println("[INFO] Node registered: " + nodeId + " with capacity " + capacity);
    }

    /**
     * Removes a node from the network.
     */
    public void unregisterNode(String nodeId) {
        nodes.remove(nodeId);
        System.out.println("[INFO] Node removed: " + nodeId);
    }

    /**
     * Enqueues a new task to be distributed in the network.
     */
    public void enqueueTask(Task task) {
        taskQueue.offer(task);
        System.out.println("[INFO] New task added to queue: " + task);
    }

    /**
     * Starts the agent and begins distributing tasks.
     */
    public void start() {
        System.out.println("[INFO] hypernode Agent started.");
        executor.execute(() -> {
            while (true) {
                Task task = taskQueue.poll();
                if (task != null) {
                    distributeTask(task);
                }
                try {
                    Thread.sleep(100); // Interval to avoid overload
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                    System.err.println("[ERROR] Agent interrupted: " + e.getMessage());
                    break;
                }
            }
        });
    }

    /**
     * Distributes a task to the most suitable available node.
     */
    private void distributeTask(Task task) {
        Optional<MachineNode> bestNode = nodes.values().stream()
                .filter(node -> node.getAvailableCapacity() >= task.getRequiredCapacity())
                .min(Comparator.comparingInt(MachineNode::getAvailableCapacity));

        if (bestNode.isPresent()) {
            MachineNode node = bestNode.get();
            boolean success = node.executeTask(task);
            if (!success) {
                retryTask(task);
            }
        } else {
            System.err.println("[WARN] No available node for task: " + task);
            retryTask(task);
        }
    }

    /**
     * Attempts to re-execute a task or discards it if the maximum retry count is exceeded.
     */
    private void retryTask(Task task) {
        if (task.getRetryCount() < MAX_TASK_RETRIES) {
            task.incrementRetryCount();
            taskQueue.offer(task);
            System.out.println("[INFO] Re-enqueuing task: " + task);
        } else {
            System.err.println("[ERROR] Task discarded after multiple retries: " + task);
        }
    }

    /**
     * Stops the agent and releases resources.
     */
    public void stop() {
        executor.shutdownNow();
        System.out.println("[INFO] hypernode Agent stopped.");
    }

    /**
     * Represents a node/machine in the network.
     */
    static class MachineNode {
        private final String id;
        private final int totalCapacity;
        private int availableCapacity;

        public MachineNode(String id, int capacity) {
            this.id = id;
            this.totalCapacity = capacity;
            this.availableCapacity = capacity;
        }

        public synchronized int getAvailableCapacity() {
            return availableCapacity;
        }

        public synchronized boolean executeTask(Task task) {
            if (availableCapacity >= task.getRequiredCapacity()) {
                availableCapacity -= task.getRequiredCapacity();
                System.out.println("[INFO] Task " + task + " executed by node " + id);
                // Simulate asynchronous execution
                CompletableFuture.runAsync(() -> completeTask(task));
                return true;
            } else {
                return false;
            }
        }

        private synchronized void completeTask(Task task) {
            try {
                Thread.sleep(task.getExecutionTime()); // Simulate execution time
                availableCapacity += task.getRequiredCapacity();
                System.out.println("[INFO] Task completed on node " + id + ": " + task);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                System.err.println("[ERROR] Task execution interrupted: " + task);
            }
        }

        @Override
        public String toString() {
            return "MachineNode{" +
                    "id='" + id + '\'' +
                    ", totalCapacity=" + totalCapacity +
                    ", availableCapacity=" + availableCapacity +
                    '}';
        }
    }

    /**
     * Represents a task to be executed in the network.
     */
    static class Task {
        private final String id;
        private final int requiredCapacity;
        private final int executionTime;
        private int retryCount;

        public Task(String id, int requiredCapacity, int executionTime) {
            this.id = id;
            this.requiredCapacity = requiredCapacity;
            this.executionTime = executionTime;
            this.retryCount = 0;
        }

        public int getRequiredCapacity() {
            return requiredCapacity;
        }

        public int getExecutionTime() {
            return executionTime;
        }

        public int getRetryCount() {
            return retryCount;
        }

        public void incrementRetryCount() {
            this.retryCount++;
        }

        @Override
        public String toString() {
            return "Task{" +
                    "id='" + id + '\'' +
                    ", requiredCapacity=" + requiredCapacity +
                    ", executionTime=" + executionTime +
                    ", retryCount=" + retryCount +
                    '}';
        }
    }

    // Main method for execution
    public static void main(String[] args) {
        hypernodeAgent agent = new hypernodeAgent();

        agent.registerNode("Node1", 100);
        agent.registerNode("Node2", 200);
        agent.registerNode("Node3", 150);

        agent.enqueueTask(new Task("Task1", 50, 3000));
        agent.enqueueTask(new Task("Task2", 75, 4000));
        agent.enqueueTask(new Task("Task3", 150, 5000));

        agent.start();

        // Simulation of execution (stop manually or add a timer to stop())
    }
}
