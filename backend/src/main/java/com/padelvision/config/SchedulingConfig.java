package com.padelvision.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Włącza zadania cykliczne. Obecnie korzysta z tego
 * {@code YouTubeStatusPoller}, który zastąpił webhook RTMP.
 */
@Configuration
@EnableScheduling
public class SchedulingConfig {
}
