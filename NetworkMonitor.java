package com.hypernode;

import java.util.*;

/**
 * NetworkMonitor - A utility to monitor and display the status of the hypernode network.
 * 
 * This class provides real-time insights into the network, such as active nodes, task queue status,
 * and system performance metrics. It is intended to assist administrators in managing and optimizing
 * the distributed computing network.
 */
public class NetworkMonitor {

    private final hypernodeAgent agent;

    public NetworkMonitor(hypernodeAgent agent) {
        this.agent = agent;
    }

    /**
     * Displays a summary of the current network status.
     */
    public void displayNetworkStatus() {
        System.out.println("\n===== hypernode Network Status =====");
        System.out.println("Active Nodes: " + agent.getNodes().size());
        agent.getNodes().forEach((id, node) -> {
            System.out.println("Node ID: " + id + ", Capacity: " + node.getAvailableCapacity() + "/" + node.getTotalCapacity());
        });
        System.out.println("Pending Tasks: " + agent.getTaskQueue().size());
        System.out.println("================================\n");
    }

    /**
     * Continuously monitors and updates the network status at regular intervals.
     */
    public void startMonitoring(int intervalMillis) {
        Timer timer = new Timer(true);
        timer.scheduleAtFixedRate(new TimerTask() {
            @Override
            public void run() {
                displayNetworkStatus();
            }
        }, 0, intervalMillis);
    }

    public static void main(String[] args) {
        hypernodeAgent agent = new hypernodeAgent();

        // Sample data for demonstration
        agent.registerNode("Node1", 100);
        agent.registerNode("Node2", 200);
        agent.registerNode("Node3", 150);
        agent.enqueueTask(new hypernodeAgent.Task("Task1", 50, 3000));
        agent.enqueueTask(new hypernodeAgent.Task("Task2", 75, 4000));
        agent.enqueueTask(new hypernodeAgent.Task("Task3", 150, 5000));

        // Start the hypernode agent
        agent.start();

        // Initialize and start the network monitor
        NetworkMonitor monitor = new NetworkMonitor(agent);
        monitor.startMonitoring(5000); // Update every 5 seconds

        // Keep the application running to allow monitoring
        try {
            Thread.sleep(30000); // Monitor for 30 seconds
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }

        // Stop the agent after monitoring
        agent.stop();
    }
}
