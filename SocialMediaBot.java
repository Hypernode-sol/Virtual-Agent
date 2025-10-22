package com.hypernode;

import java.util.*;
import java.net.HttpURLConnection;
import java.net.URL;
import java.io.OutputStream;

/**
 * SocialMediaBot - A utility to post updates about the hypernode network on social media platforms.
 * 
 * This bot communicates with a social media API (e.g., Xer or Mastodon) to share real-time
 * updates about the network's performance, such as active nodes, completed tasks, or general health.
 * Additionally, it can analyze data related to computational power and provide insights to the hypernodeAgent.
 */
public class SocialMediaBot {

    private final String apiUrl;
    private final String apiKey;

    public SocialMediaBot(String apiUrl, String apiKey) {
        this.apiUrl = apiUrl;
        this.apiKey = apiKey;
    }

    /**
     * Posts a message to the configured social media platform.
     * 
     * @param message The message to be posted.
     * @return True if the message was successfully posted; otherwise, false.
     */
    public boolean postUpdate(String message) {
        try {
            URL url = new URL(apiUrl);
            HttpURLConnection connection = (HttpURLConnection) url.openConnection();
            connection.setRequestMethod("POST");
            connection.setRequestProperty("Authorization", "Bearer " + apiKey);
            connection.setRequestProperty("Content-Type", "application/json");
            connection.setDoOutput(true);

            String jsonPayload = "{\"status\": \"" + message + "\"}";
            try (OutputStream os = connection.getOutputStream()) {
                byte[] input = jsonPayload.getBytes("utf-8");
                os.write(input, 0, input.length);
            }

            int responseCode = connection.getResponseCode();
            if (responseCode == HttpURLConnection.HTTP_OK || responseCode == HttpURLConnection.HTTP_CREATED) {
                System.out.println("[INFO] Social media update posted successfully.");
                return true;
            } else {
                System.err.println("[ERROR] Failed to post update. Response code: " + responseCode);
                return false;
            }
        } catch (Exception e) {
            System.err.println("[ERROR] Exception while posting update: " + e.getMessage());
            return false;
        }
    }

    /**
     * Generates a status update message based on the current network state.
     * 
     * @param agent The hypernodeAgent to extract data from.
     * @return A string containing the status update.
     */
    public String generateStatusUpdate(hypernodeAgent agent) {
        int activeNodes = agent.getNodes().size();
        int pendingTasks = agent.getTaskQueue().size();
        return String.format(
                "hypernode Status: %d active nodes, %d tasks pending. Join us and contribute your computational power!",
                activeNodes, pendingTasks);
    }

    /**
     * Analyzes computational power data and feeds insights back to the hypernodeAgent.
     * 
     * @param rawData A map of raw computational power data (e.g., node performance metrics).
     * @return Insights extracted from the data.
     */
    public Map<String, Object> analyzeComputationalPowerData(Map<String, Object> rawData) {
        Map<String, Object> insights = new HashMap<>();

        // Example analysis: Average capacity utilization
        List<Integer> utilizations = (List<Integer>) rawData.get("utilizations");
        if (utilizations != null && !utilizations.isEmpty()) {
            double averageUtilization = utilizations.stream().mapToInt(Integer::intValue).average().orElse(0.0);
            insights.put("averageUtilization", averageUtilization);
        }

        // Example analysis: Nodes under high load
        Map<String, Integer> nodeLoads = (Map<String, Integer>) rawData.get("nodeLoads");
        if (nodeLoads != null) {
            List<String> highLoadNodes = new ArrayList<>();
            for (Map.Entry<String, Integer> entry : nodeLoads.entrySet()) {
                if (entry.getValue() > 80) { // Threshold for high load
                    highLoadNodes.add(entry.getKey());
                }
            }
            insights.put("highLoadNodes", highLoadNodes);
        }

        // Example analysis: Tasks requiring high computational power
        List<hypernodeAgent.Task> tasks = (List<hypernodeAgent.Task>) rawData.get("tasks");
        if (tasks != null) {
            List<hypernodeAgent.Task> highPowerTasks = new ArrayList<>();
            for (hypernodeAgent.Task task : tasks) {
                if (task.getRequiredCapacity() > 100) { // Threshold for high power
                    highPowerTasks.add(task);
                }
            }
            insights.put("highPowerTasks", highPowerTasks);
        }

        System.out.println("[INFO] Computational power data analyzed: " + insights);
        return insights;
    }

    public static void main(String[] args) {
        // Replace with actual API URL and Key for the social media platform
        String apiUrl = "https://api.example.com/statuses"; // Example API endpoint
        String apiKey = "your_api_key_here";

        hypernodeAgent agent = new hypernodeAgent();

        // Sample data for demonstration
        agent.registerNode("Node1", 100);
        agent.registerNode("Node2", 200);
        agent.enqueueTask(new hypernodeAgent.Task("Task1", 50, 3000));
        agent.enqueueTask(new hypernodeAgent.Task("Task2", 75, 4000));

        SocialMediaBot bot = new SocialMediaBot(apiUrl, apiKey);

        // Generate and post an update
        String statusUpdate = bot.generateStatusUpdate(agent);
        bot.postUpdate(statusUpdate);

        // Analyze computational power data
        Map<String, Object> rawData = new HashMap<>();
        rawData.put("utilizations", Arrays.asList(50, 75, 90));
        rawData.put("nodeLoads", Map.of("Node1", 85, "Node2", 60));
        rawData.put("tasks", List.of(
                new hypernodeAgent.Task("Task1", 120, 5000),
                new hypernodeAgent.Task("Task2", 50, 3000)));

        Map<String, Object> insights = bot.analyzeComputationalPowerData(rawData);

        // Insights could be fed back to the hypernodeAgent for better decision-making
        System.out.println("[INFO] Insights generated: " + insights);
    }
}
