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
import com.crm.module.tag.entity.CustomerTag;
import com.crm.module.tag.entity.CustomerTagRel;
import com.crm.module.tag.mapper.CustomerTagMapper;
import com.crm.module.tag.mapper.CustomerTagRelMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CustomerProfileService {

    private final CustomerMapper customerMapper;
    private final OrderMapper orderMapper;
    private final FollowUpMapper followUpMapper;
    private final ServiceRequestMapper serviceRequestMapper;
    private final CustomerTagRelMapper customerTagRelMapper;
    private final CustomerTagMapper customerTagMapper;

    /**
     * 生成客户画像总结
     */
    public Map<String, Object> generate(Long customerId) {
        Map<String, Object> profile = new LinkedHashMap<>();

        // 基本信息
        Customer customer = customerMapper.selectById(customerId);
        if (customer == null) {
            profile.put("summary", "客户不存在");
            profile.put("stats", Collections.emptyMap());
            return profile;
        }

        String customerName = customer.getName() != null ? customer.getName() : "未知";
        String level = customer.getLevel() != null ? customer.getLevel() : "普通客户";
        String industry = customer.getIndustry() != null ? customer.getIndustry() : "";

        // 订单统计
        LambdaQueryWrapper<Order> orderWrapper = new LambdaQueryWrapper<>();
        orderWrapper.eq(Order::getCustomerId, customerId);
        List<Order> allOrders = orderMapper.selectList(orderWrapper);

        int totalOrders = allOrders.size();
        BigDecimal totalAmount = BigDecimal.ZERO;
        Map<String, Integer> categoryCount = new HashMap<>();

        for (Order order : allOrders) {
            if (order.getTotalAmount() != null) {
                totalAmount = totalAmount.add(order.getTotalAmount());
            }
            String productName = "最近购买产品";
            if (productName != null && !productName.isEmpty()) {
                String category = guessCategory(productName);
                categoryCount.merge(category, 1, Integer::sum);
            }
        }

        String preferenceCategory = categoryCount.entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey)
                .orElse("综合产品");

        // 跟进统计
        LambdaQueryWrapper<FollowUp> followWrapper = new LambdaQueryWrapper<>();
        followWrapper.eq(FollowUp::getCustomerId, customerId);
        List<FollowUp> followUps = followUpMapper.selectList(followWrapper);
        int followCount = followUps.size();
        String lastFollowDate = "无";
        if (!followUps.isEmpty()) {
            LocalDateTime maxDate = followUps.stream()
                    .map(FollowUp::getCreatedAt)
                    .filter(Objects::nonNull)
                    .max(LocalDateTime::compareTo)
                    .orElse(null);
            if (maxDate != null) {
                long days = java.time.Duration.between(maxDate, LocalDateTime.now()).toDays();
                if (days == 0) {
                    lastFollowDate = "今天";
                } else if (days == 1) {
                    lastFollowDate = "昨天";
                } else {
                    lastFollowDate = days + "天前";
                }
            }
        }

        // 服务请求统计
        LambdaQueryWrapper<ServiceRequest> serviceWrapper = new LambdaQueryWrapper<>();
        serviceWrapper.eq(ServiceRequest::getCustomerId, customerId);
        Long serviceCount = serviceRequestMapper.selectCount(serviceWrapper);
        if (serviceCount == null) serviceCount = 0L;

        // 标签
        LambdaQueryWrapper<CustomerTagRel> relWrapper = new LambdaQueryWrapper<>();
        relWrapper.eq(CustomerTagRel::getCustomerId, customerId);
        List<CustomerTagRel> tagRels = customerTagRelMapper.selectList(relWrapper);
        List<String> tagNames = new ArrayList<>();
        if (tagRels != null && !tagRels.isEmpty()) {
            List<Long> tagIds = tagRels.stream()
                    .map(CustomerTagRel::getTagId)
                    .filter(Objects::nonNull)
                    .collect(Collectors.toList());
            if (!tagIds.isEmpty()) {
                LambdaQueryWrapper<CustomerTag> tagWrapper = new LambdaQueryWrapper<>();
                tagWrapper.in(CustomerTag::getId, tagIds);
                List<CustomerTag> tags = customerTagMapper.selectList(tagWrapper);
                if (tags != null) {
                    tagNames = tags.stream()
                            .map(CustomerTag::getName)
                            .filter(Objects::nonNull)
                            .collect(Collectors.toList());
                }
            }
        }

        // 消费能力评估
        String consumptionAbility;
        BigDecimal amount = totalAmount;
        if (amount.compareTo(new BigDecimal("100000")) >= 0) {
            consumptionAbility = "高";
        } else if (amount.compareTo(new BigDecimal("50000")) >= 0) {
            consumptionAbility = "中高";
        } else if (amount.compareTo(new BigDecimal("10000")) >= 0) {
            consumptionAbility = "中等";
        } else if (amount.compareTo(BigDecimal.ZERO) > 0) {
            consumptionAbility = "一般";
        } else {
            consumptionAbility = "暂无数据";
        }

        // 活跃度评估
        String activityLevel;
        if (followCount >= 10 && (lastFollowDate.equals("今天") || lastFollowDate.equals("昨天") || lastFollowDate.endsWith("天前"))) {
            activityLevel = "高";
        } else if (followCount >= 5) {
            activityLevel = "中等";
        } else if (followCount > 0) {
            activityLevel = "一般";
        } else {
            activityLevel = "低";
        }

        // 构建统计信息
        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("level", level);
        stats.put("totalOrders", totalOrders);
        stats.put("totalAmount", totalAmount);
        stats.put("followCount", followCount);
        stats.put("lastFollowDate", lastFollowDate);
        stats.put("tagNames", tagNames);
        stats.put("consumptionAbility", consumptionAbility);
        stats.put("activityLevel", activityLevel);
        stats.put("preferenceCategory", preferenceCategory);

        // 生成自然语言摘要
        String industryText = !industry.isEmpty() ? "，来自" + industry + "行业" : "";
        String summary = customerName + "是" + level + industryText + "。";

        if (totalOrders > 0) {
            summary += "历史总消费¥" + totalAmount + "，共完成" + totalOrders + "笔订单，";
            summary += "主要偏好" + preferenceCategory + "。";
        } else {
            summary += "暂无消费记录。";
        }

        summary += "活跃度：" + activityLevel + "。";
        summary += "最近一次跟进是" + lastFollowDate + "。";

        // 建议
        StringBuilder suggestion = new StringBuilder();
        if ("高".equals(consumptionAbility) && "高".equals(activityLevel)) {
            suggestion.append("建议：该客户价值高且活跃，可优先推荐新品和高端系列，安排专属客户经理维护。");
        } else if ("高".equals(consumptionAbility) && !"高".equals(activityLevel)) {
            suggestion.append("建议：该客户消费能力高但活跃度不足，建议加强回访，推送个性化优惠方案激活。");
        } else if ("高".equals(activityLevel) && !"高".equals(consumptionAbility)) {
            suggestion.append("建议：该客户互动积极但消费有限，可尝试向上销售，推荐中高端产品线。");
        } else {
            suggestion.append("建议：保持常规跟进频率，关注客户需求变化，适时推荐合适产品。");
        }

        if (!tagNames.isEmpty()) {
            summary += "标签：" + String.join("、", tagNames) + "。";
        }

        summary += suggestion.toString();

        profile.put("summary", summary);
        profile.put("stats", stats);

        return profile;
    }

    /**
     * 根据产品名推测分类
     */
    private String guessCategory(String productName) {
        if (productName == null) return "其他";
        String name = productName.toLowerCase();
        if (name.contains("家具") || name.contains("家居") || name.contains("办公桌") || name.contains("椅")) {
            return "家居用品";
        } else if (name.contains("电子") || name.contains("设备") || name.contains("仪器")) {
            return "电子设备";
        } else if (name.contains("软件") || name.contains("系统") || name.contains("平台")) {
            return "软件服务";
        } else if (name.contains("咨询") || name.contains("培训")) {
            return "咨询服务";
        } else if (name.contains("配件") || name.contains("零件")) {
            return "配件耗材";
        } else {
            return "其他";
        }
    }
}
