package com.hypernode;

import java.util.*;

/**
 * FailureRecoveryManager - Responsible for detecting and handling failures within the hypernode network.
 *
 * This class implements strategies to recover failed nodes, reallocate tasks, and ensure network stability.
 */
public class FailureRecoveryManager {

    private final hypernodeAgent agent;
    private final Queue<String> recoveryQueue;
    private final Map<String, Integer> failureCount;

    /**
     * Constructor initializes the FailureRecoveryManager with the hypernodeAgent.
     * 
     * @param agent The central agent managing the hypernode network.
     */
    public FailureRecoveryManager(hypernodeAgent agent) {
        this.agent = agent;
        this.recoveryQueue = new LinkedList<>();
        this.failureCount = new HashMap<>();
    }

    /**
     * Adds a failed node to the recovery queue and tracks failure occurrences.
     * 
     * @param nodeId The ID of the failed node.
     */
    public void reportFailure(String nodeId) {
        recoveryQueue.add(nodeId);
        failureCount.put(nodeId, failureCount.getOrDefault(nodeId, 0) + 1);
        System.out.println("[ALERT] Node reported as failed: " + nodeId);
    }

    /**
     * Attempts to recover nodes from the recovery queue.
     */
    public void processRecoveryQueue() {
        while (!recoveryQueue.isEmpty()) {
            String nodeId = recoveryQueue.poll();
            boolean recoverySuccessful = attemptNodeRecovery(nodeId);

            if (!recoverySuccessful) {
                System.err.println("[ERROR] Failed to recover node: " + nodeId);
                reallocateTasks(nodeId);
            } else {
                System.out.println("[INFO] Node successfully recovered: " + nodeId);
            }
        }
    }

    /**
     * Attempts to recover a single node.
     * 
     * @param nodeId The ID of the node to recover.
     * @return True if the node is successfully recovered; otherwise, false.
     */
    private boolean attemptNodeRecovery(String nodeId) {
        hypernodeAgent.Node node = agent.getNode(nodeId);

        if (node == null) {
            System.err.println("[ERROR] Node not found for recovery: " + nodeId);
            return false;
        }

        // Simulate recovery by resetting the node's status
        boolean recoverySuccessful = node.recover();
        if (recoverySuccessful) {
            node.setActive(true);
        }
        return recoverySuccessful;
    }

    /**
     * Reallocates tasks assigned to a failed node to other available nodes.
     * 
     * @param nodeId The ID of the failed node.
     */
    private void reallocateTasks(String nodeId) {
        hypernodeAgent.Node node = agent.getNode(nodeId);

        if (node == null) {
            System.err.println("[ERROR] Cannot reallocate tasks. Node not found: " + nodeId);
            return;
        }

        List<hypernodeAgent.Task> tasks = node.getAssignedTasks();
        for (hypernodeAgent.Task task : tasks) {
            System.out.println("[INFO] Reallocating task: " + task.getTaskId());
            agent.enqueueTask(task);
        }
        node.clearTasks();
    }

    /**
     * Periodically checks for underperforming nodes and adds them to the recovery queue if necessary.
     */
    public void monitorPerformance() {
        for (hypernodeAgent.Node node : agent.getNodes().values()) {
            if (!node.isPerformingOptimally()) {
                System.out.println("[WARNING] Node underperforming: " + node.getNodeId());
                reportFailure(node.getNodeId());
            }
        }
    }

    public static void main(String[] args) {
        hypernodeAgent agent = new hypernodeAgent();
        FailureRecoveryManager recoveryManager = new FailureRecoveryManager(agent);

        // Sample nodes and tasks
        agent.registerNode("Node1", 100);
        agent.registerNode("Node2", 200);
        agent.enqueueTask(new hypernodeAgent.Task("Task1", 50, 3000));

        // Simulate a node failure
        recoveryManager.reportFailure("Node1");

        // Process recovery
        recoveryManager.processRecoveryQueue();

        // Monitor network performance
        recoveryManager.monitorPerformance();
    }
}
