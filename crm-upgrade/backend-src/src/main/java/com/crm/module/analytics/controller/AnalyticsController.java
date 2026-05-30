package com.crm.module.analytics.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.crm.common.Result;
import com.crm.module.customer.entity.Customer;
import com.crm.module.customer.mapper.CustomerMapper;
import com.crm.module.lead.entity.Lead;
import com.crm.module.lead.mapper.LeadMapper;
import com.crm.module.opportunity.entity.Opportunity;
import com.crm.module.opportunity.mapper.OpportunityMapper;
import com.crm.module.quotation.entity.Order;
import com.crm.module.quotation.entity.Quotation;
import com.crm.module.quotation.mapper.OrderMapper;
import com.crm.module.quotation.mapper.QuotationMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final CustomerMapper customerMapper;
    private final LeadMapper leadMapper;
    private final OpportunityMapper opportunityMapper;
    private final OrderMapper orderMapper;
    private final QuotationMapper quotationMapper;

    /**
     * 仪表盘增强统计数据
     */
    @GetMapping("/dashboard")
    public Result<Map<String, Object>> dashboard() {
        Map<String, Object> data = new LinkedHashMap<>();

        // 客户统计
        Long totalCustomers = customerMapper.selectCount(null);
        LambdaQueryWrapper<Customer> newCustomerWrapper = new LambdaQueryWrapper<>();
        LocalDate today = LocalDate.now();
        newCustomerWrapper.between(Customer::getCreatedAt, today.atStartOfDay(), today.plusDays(1).atStartOfDay());
        Long todayNewCustomers = customerMapper.selectCount(newCustomerWrapper);

        Map<String, Object> customerStats = new LinkedHashMap<>();
        customerStats.put("total", totalCustomers);
        customerStats.put("todayNew", todayNewCustomers);
        data.put("customer", customerStats);

        // 线索统计
        Long totalLeads = leadMapper.selectCount(null);
        LambdaQueryWrapper<Lead> newLeadWrapper = new LambdaQueryWrapper<>();
        newLeadWrapper.eq(Lead::getStatus, "新建");
        Long newLeads = leadMapper.selectCount(newLeadWrapper);

        LambdaQueryWrapper<Lead> todayLeadWrapper = new LambdaQueryWrapper<>();
        todayLeadWrapper.between(Lead::getCreatedAt, today.atStartOfDay(), today.plusDays(1).atStartOfDay());
        Long todayNewLeads = leadMapper.selectCount(todayLeadWrapper);

        Map<String, Object> leadStats = new LinkedHashMap<>();
        leadStats.put("total", totalLeads);
        leadStats.put("newCount", newLeads);
        leadStats.put("todayNew", todayNewLeads);
        data.put("lead", leadStats);

        // 商机统计
        Long totalOpportunities = opportunityMapper.selectCount(null);
        LambdaQueryWrapper<Opportunity> wonOpportunityWrapper = new LambdaQueryWrapper<>();
        wonOpportunityWrapper.eq(Opportunity::getStage, "赢单");
        Long wonCount = opportunityMapper.selectCount(wonOpportunityWrapper);

        List<Opportunity> allOpportunities = opportunityMapper.selectList(null);
        BigDecimal totalAmount = allOpportunities.stream()
                .map(o -> o.getAmount() != null ? o.getAmount() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal wonAmount = allOpportunities.stream()
                .filter(o -> "赢单".equals(o.getStage()))
                .map(o -> o.getAmount() != null ? o.getAmount() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        Map<String, Object> opportunityStats = new LinkedHashMap<>();
        opportunityStats.put("total", totalOpportunities);
        opportunityStats.put("wonCount", wonCount);
        opportunityStats.put("totalAmount", totalAmount);
        opportunityStats.put("wonAmount", wonAmount);
        opportunityStats.put("winRate", totalOpportunities > 0
                ? String.format("%.1f%%", wonCount.doubleValue() / totalOpportunities * 100)
                : "0%");
        data.put("opportunity", opportunityStats);

        // 报价统计
        Long totalQuotations = quotationMapper.selectCount(null);
        LambdaQueryWrapper<Quotation> approvedQuotationWrapper = new LambdaQueryWrapper<>();
        approvedQuotationWrapper.eq(Quotation::getStatus, 2);
        Long approvedCount = quotationMapper.selectCount(approvedQuotationWrapper);

        Map<String, Object> quotationStats = new LinkedHashMap<>();
        quotationStats.put("total", totalQuotations);
        quotationStats.put("approved", approvedCount);
        data.put("quotation", quotationStats);

        // 订单统计
        Long totalOrders = orderMapper.selectCount(null);
        List<Order> allOrders = orderMapper.selectList(null);
        BigDecimal totalOrderAmount = allOrders.stream()
                .map(o -> o.getFinalAmount() != null ? o.getFinalAmount() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        LambdaQueryWrapper<Order> todayOrderWrapper = new LambdaQueryWrapper<>();
        todayOrderWrapper.between(Order::getCreatedAt, today.atStartOfDay(), today.plusDays(1).atStartOfDay());
        Long todayOrders = orderMapper.selectCount(todayOrderWrapper);

        Map<String, Object> orderStats = new LinkedHashMap<>();
        orderStats.put("total", totalOrders);
        orderStats.put("totalAmount", totalOrderAmount);
        orderStats.put("todayNew", todayOrders);
        data.put("order", orderStats);

        return Result.ok(data);
    }

    /**
     * 销售趋势：按月份统计销售额
     */
    @GetMapping("/sales-trend")
    public Result<List<Map<String, Object>>> salesTrend(@RequestParam(defaultValue = "12") int months) {
        LocalDate startDate = LocalDate.now().minusMonths(months);

        List<Order> orders = orderMapper.selectList(new LambdaQueryWrapper<Order>()
                .ge(Order::getCreatedAt, startDate.atStartOfDay())
                .orderByAsc(Order::getCreatedAt));

        // 按月份分组统计
        Map<String, Map<String, Object>> monthMap = new LinkedHashMap<>();
        for (int i = months - 1; i >= 0; i--) {
            String key = LocalDate.now().minusMonths(i).format(java.time.format.DateTimeFormatter.ofPattern("yyyy-MM"));
            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("month", key);
            entry.put("amount", BigDecimal.ZERO);
            entry.put("count", 0);
            monthMap.put(key, entry);
        }

        for (Order order : orders) {
            if (order.getCreatedAt() != null) {
                String key = order.getCreatedAt().format(java.time.format.DateTimeFormatter.ofPattern("yyyy-MM"));
                Map<String, Object> entry = monthMap.get(key);
                if (entry != null) {
                    BigDecimal current = (BigDecimal) entry.get("amount");
                    BigDecimal orderAmount = order.getFinalAmount() != null ? order.getFinalAmount() : BigDecimal.ZERO;
                    entry.put("amount", current.add(orderAmount));
                    entry.put("count", (int) entry.get("count") + 1);
                }
            }
        }

        return Result.ok(new ArrayList<>(monthMap.values()));
    }

    /**
     * 商机漏斗分析
     */
    @GetMapping("/funnel")
    public Result<List<Map<String, Object>>> funnel() {
        List<Opportunity> opportunities = opportunityMapper.selectList(
                new LambdaQueryWrapper<Opportunity>().ne(Opportunity::getStage, "输单"));

        String[] stages = {"初步接触", "需求分析", "方案报价", "谈判", "赢单"};
        List<Map<String, Object>> funnel = new ArrayList<>();

        for (String stage : stages) {
            List<Opportunity> stageOpps = opportunities.stream()
                    .filter(o -> stage.equals(o.getStage()))
                    .collect(Collectors.toList());

            Map<String, Object> data = new LinkedHashMap<>();
            data.put("stage", stage);
            data.put("count", stageOpps.size());
            data.put("totalAmount", stageOpps.stream()
                    .map(o -> o.getAmount() != null ? o.getAmount() : BigDecimal.ZERO)
                    .reduce(BigDecimal.ZERO, BigDecimal::add));
            funnel.add(data);
        }

        return Result.ok(funnel);
    }

    /**
     * 客户来源分布
     */
    @GetMapping("/customer-source")
    public Result<List<Map<String, Object>>> customerSource() {
        List<Customer> customers = customerMapper.selectList(null);

        Map<String, Long> sourceCount = customers.stream()
                .filter(c -> c.getSource() != null)
                .collect(Collectors.groupingBy(Customer::getSource, Collectors.counting()));

        // 按行业分布
        Map<String, Long> industryCount = customers.stream()
                .filter(c -> c.getIndustry() != null)
                .collect(Collectors.groupingBy(Customer::getIndustry, Collectors.counting()));

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("total", customers.size());
        result.put("sourceDistribution", sourceCount.entrySet().stream()
                .map(e -> {
                    Map<String, Object> item = new LinkedHashMap<>();
                    item.put("name", e.getKey());
                    item.put("value", e.getValue());
                    return item;
                })
                .collect(Collectors.toList()));
        result.put("industryDistribution", industryCount.entrySet().stream()
                .map(e -> {
                    Map<String, Object> item = new LinkedHashMap<>();
                    item.put("name", e.getKey());
                    item.put("value", e.getValue());
                    return item;
                })
                .collect(Collectors.toList()));

        return Result.ok(List.of(result));
    }

    /**
     * 员工销售排名
     */
    @GetMapping("/employee-ranking")
    public Result<List<Map<String, Object>>> employeeRanking() {
        List<Order> orders = orderMapper.selectList(null);

        // 按 ownerId 汇总销售额
        Map<Long, Map<String, Object>> rankingMap = new LinkedHashMap<>();

        for (Order order : orders) {
            if (order.getOwnerId() == null) continue;
            Long ownerId = order.getOwnerId();
            Map<String, Object> entry = rankingMap.computeIfAbsent(ownerId, k -> {
                Map<String, Object> m = new LinkedHashMap<>();
                m.put("ownerId", ownerId);
                m.put("totalAmount", BigDecimal.ZERO);
                m.put("orderCount", 0);
                return m;
            });
            BigDecimal amount = order.getFinalAmount() != null ? order.getFinalAmount() : BigDecimal.ZERO;
            entry.put("totalAmount", ((BigDecimal) entry.get("totalAmount")).add(amount));
            entry.put("orderCount", (int) entry.get("orderCount") + 1);
        }

        // 按销售额降序排列
        List<Map<String, Object>> ranking = new ArrayList<>(rankingMap.values());
        ranking.sort((a, b) -> ((BigDecimal) b.get("totalAmount")).compareTo((BigDecimal) a.get("totalAmount")));

        // 添加排名序号
        for (int i = 0; i < ranking.size(); i++) {
            ranking.get(i).put("rank", i + 1);
        }

        return Result.ok(ranking);
    }
}
