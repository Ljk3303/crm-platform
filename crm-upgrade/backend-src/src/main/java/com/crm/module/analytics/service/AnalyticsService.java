package com.crm.module.analytics.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.*;

@Service
@RequiredArgsConstructor
public class AnalyticsService {

    public Map<String, Object> dashboard() {
        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("totalCustomers", 0L);
        stats.put("totalOrders", 0L);
        stats.put("totalRevenue", BigDecimal.ZERO);
        stats.put("activeOpportunities", 0);
        stats.put("conversionRate", "0%");
        return stats;
    }

    public List<Map<String, Object>> salesTrend(Integer months) {
        List<Map<String, Object>> trend = new ArrayList<>();
        for (int i = 0; i < months; i++) {
            Map<String, Object> month = new LinkedHashMap<>();
            month.put("month", "2026-" + String.format("%02d", i + 1));
            month.put("amount", BigDecimal.ZERO);
            month.put("orderCount", 0);
            trend.add(month);
        }
        return trend;
    }

    public List<Map<String, Object>> funnel() {
        return List.of(
                Map.of("stage", "初步接触", "count", 0, "amount", BigDecimal.ZERO),
                Map.of("stage", "需求分析", "count", 0, "amount", BigDecimal.ZERO),
                Map.of("stage", "方案报价", "count", 0, "amount", BigDecimal.ZERO),
                Map.of("stage", "谈判", "count", 0, "amount", BigDecimal.ZERO),
                Map.of("stage", "赢单", "count", 0, "amount", BigDecimal.ZERO)
        );
    }

    public List<Map<String, Object>> customerSource() {
        return List.of(
                Map.of("source", "网站", "count", 0),
                Map.of("source", "电话", "count", 0),
                Map.of("source", "介绍", "count", 0),
                Map.of("source", "广告", "count", 0),
                Map.of("source", "其他", "count", 0)
        );
    }

    public List<Map<String, Object>> employeeRanking() {
        return new ArrayList<>();
    }
}
