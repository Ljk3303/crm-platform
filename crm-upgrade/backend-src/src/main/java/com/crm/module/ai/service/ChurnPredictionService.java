package com.crm.module.ai.service;

// Mock逻辑，未来替换为DeepSeek API

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.crm.module.customer.entity.Customer;
import com.crm.module.customer.mapper.CustomerMapper;
import com.crm.module.sales.entity.FollowUp;
import com.crm.module.sales.entity.Order;
import com.crm.module.sales.mapper.FollowUpMapper;
import com.crm.module.sales.mapper.OrderMapper;
import com.crm.module.service.entity.ServiceRequest;
import com.crm.module.service.mapper.ServiceRequestMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ChurnPredictionService {

    private final CustomerMapper customerMapper;
    private final OrderMapper orderMapper;
    private final FollowUpMapper followUpMapper;
    private final ServiceRequestMapper serviceRequestMapper;

    /**
     * 单个客户流失风险预测
     */
    public Map<String, Object> predict(Long customerId) {
        Map<String, Object> result = new LinkedHashMap<>();
        List<String> reasons = new ArrayList<>();
        int riskScore = 0;

        // 查询客户基本信息
        Customer customer = customerMapper.selectById(customerId);
        if (customer == null) {
            result.put("riskScore", 0);
            result.put("riskLevel", "未知");
            result.put("riskColor", "gray");
            result.put("reasons", Collections.emptyList());
            result.put("suggestion", "客户不存在");
            result.put("customerName", "未知");
            result.put("lastProductName", "");
            return result;
        }

        String customerName = customer.getName() != null ? customer.getName() : "未知";
        String customerLevel = customer.getLevel() != null ? customer.getLevel() : "";

        // 1. 查询最近6个月订单数量
        LocalDateTime sixMonthsAgo = LocalDateTime.now().minusMonths(6);
        LambdaQueryWrapper<Order> orderWrapper = new LambdaQueryWrapper<>();
        orderWrapper.eq(Order::getCustomerId, customerId)
                    .ge(Order::getCreatedAt, sixMonthsAgo);
        List<Order> recentOrders = orderMapper.selectList(orderWrapper);
        int orderCount = recentOrders.size();
        String lastProductName = "";
        if (!recentOrders.isEmpty()) {
            Order lastOrder = recentOrders.get(recentOrders.size() - 1);
            lastProductName = lastOrder.getProductName() != null ? lastOrder.getProductName() : "";
        }

        // 无订单加40分
        if (orderCount == 0) {
            riskScore += 40;
            reasons.add("近6个月内无任何订单记录");
        }

        // 2. 查询最近跟进时间
        LambdaQueryWrapper<FollowUp> followUpWrapper = new LambdaQueryWrapper<>();
        followUpWrapper.eq(FollowUp::getCustomerId, customerId)
                       .orderByDesc(FollowUp::getCreatedAt)
                       .last("LIMIT 1");
        List<FollowUp> followUps = followUpMapper.selectList(followUpWrapper);
        boolean overdueFollow = false;
        if (followUps.isEmpty()) {
            // 无任何跟进记录视为严重
            riskScore += 30;
            reasons.add("从未有过跟进记录");
        } else {
            FollowUp lastFollow = followUps.get(0);
            LocalDateTime lastFollowDate = lastFollow.getCreatedAt();
            long daysSinceFollow = java.time.Duration.between(lastFollowDate, LocalDateTime.now()).toDays();
            if (daysSinceFollow > 30) {
                riskScore += 30;
                reasons.add("距上次跟进已超过" + daysSinceFollow + "天");
                overdueFollow = true;
            }
        }

        // 3. 查询服务投诉数量
        LambdaQueryWrapper<ServiceRequest> complaintWrapper = new LambdaQueryWrapper<>();
        complaintWrapper.eq(ServiceRequest::getCustomerId, customerId)
                        .eq(ServiceRequest::getType, "投诉");
        Long complaintCount = serviceRequestMapper.selectCount(complaintWrapper);
        if (complaintCount != null && complaintCount > 0) {
            riskScore += 20;
            reasons.add("存在" + complaintCount + "条服务投诉记录");
        }

        // 4. 客户等级"沉睡"
        if ("沉睡".equals(customerLevel)) {
            riskScore += 10;
            reasons.add("客户等级标记为"沉睡"");
        }

        // 定级
        String riskLevel;
        String riskColor;
        String suggestion;
        if (riskScore <= 30) {
            riskLevel = "低风险";
            riskColor = "green";
            suggestion = "客户状态良好，保持常规跟进频率即可";
        } else if (riskScore <= 60) {
            riskLevel = "中风险";
            riskColor = "yellow";
            suggestion = "客户有流失迹象，建议加强互动，安排专属活动或优惠";
        } else {
            riskLevel = "高风险";
            riskColor = "red";
            suggestion = "客户流失风险很高，建议立即安排专人回访，了解需求并提供专属解决方案";
        }

        result.put("riskScore", riskScore);
        result.put("riskLevel", riskLevel);
        result.put("riskColor", riskColor);
        result.put("reasons", reasons);
        result.put("suggestion", suggestion);
        result.put("customerName", customerName);
        result.put("lastProductName", lastProductName);

        return result;
    }

    /**
     * 批量客户流失风险预测
     */
    public Map<Long, Map<String, Object>> batchPredict(String customerIds) {
        List<Long> idList = Arrays.stream(customerIds.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .map(Long::valueOf)
                .collect(Collectors.toList());

        Map<Long, Map<String, Object>> resultMap = new LinkedHashMap<>();
        for (Long customerId : idList) {
            Map<String, Object> fullResult = predict(customerId);
            // 只返回摘要信息
            Map<String, Object> summary = new LinkedHashMap<>();
            summary.put("riskScore", fullResult.get("riskScore"));
            summary.put("riskLevel", fullResult.get("riskLevel"));
            summary.put("riskColor", fullResult.get("riskColor"));
            summary.put("customerName", fullResult.get("customerName"));
            resultMap.put(customerId, summary);
        }

        return resultMap;
    }
}
