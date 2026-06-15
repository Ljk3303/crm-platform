package com.crm.module.ai.service;

// Mock逻辑，未来替换为DeepSeek API

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.crm.module.customer.entity.Customer;
import com.crm.module.customer.mapper.CustomerMapper;
import com.crm.module.sales.entity.Order;
import com.crm.module.sales.mapper.OrderMapper;
import com.crm.module.service.entity.ServiceRequest;
import com.crm.module.service.mapper.ServiceRequestMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SalesAgentService {

    private final CustomerMapper customerMapper;
    private final OrderMapper orderMapper;
    private final ServiceRequestMapper serviceRequestMapper;

    /**
     * 执行销售助手命令（关键词匹配）
     */
    public Map<String, Object> execute(String command) {
        Map<String, Object> result = new LinkedHashMap<>();
        if (command == null || command.trim().isEmpty()) {
            result.put("intent", "未知");
            result.put("steps", Collections.emptyList());
            result.put("result", "请输入指令，输入[帮助]查看可用命令");
            return result;
        }

        String cmd = command.trim();

        // 帮助
        if (cmd.contains("帮助") || cmd.equalsIgnoreCase("help")) {
            result.put("intent", "获取帮助");
            result.put("steps", Collections.singletonList("展示可用命令列表"));
            result.put("result", buildHelpMessage());
            return result;
        }

        // 今日/今天
        if (cmd.contains("今日") || cmd.contains("今天")) {
            result.put("intent", "今日工作概览");
            List<String> steps = new ArrayList<>();
            steps.add("查询今日日程");
            steps.add("查询待办任务");
            steps.add("计算优先跟进客户");
            result.put("steps", steps);
            result.put("result", todayPriority());
            return result;
        }

        // 跟进/优先
        if (cmd.contains("跟进") || cmd.contains("优先")) {
            result.put("intent", "今日优先跟进");
            List<String> steps = Arrays.asList(
                    "筛选过期跟进客户",
                    "筛选高价值无订单客户",
                    "筛选待处理服务请求客户",
                    "综合排序取Top5"
            );
            result.put("steps", steps);
            result.put("result", todayPriority());
            return result;
        }

        // 预测
        if (cmd.contains("预测")) {
            result.put("intent", "销售预测");
            List<String> steps = Arrays.asList(
                    "查询近12个月销售数据",
                    "计算移动平均趋势",
                    "生成未来3个月预测"
            );
            result.put("steps", steps);
            result.put("result", salesForecast());
            return result;
        }

        // RFM/细分
        if (cmd.contains("RFM") || cmd.contains("细分")) {
            result.put("intent", "RFM客户细分分析");
            List<String> steps = Arrays.asList(
                    "查询所有客户及订单数据",
                    "计算R/F/M三项指标",
                    "按规则将客户划分为6个群体",
                    "生成细分报告"
            );
            result.put("steps", steps);
            result.put("result", rfmAnalysis());
            return result;
        }

        // 统计/分析/仪表盘
        if (cmd.contains("统计") || cmd.contains("分析") || cmd.contains("仪表盘")) {
            result.put("intent", "仪表盘统计");
            List<String> steps = new ArrayList<>();
            steps.add("统计客户总数");
            steps.add("统计本月订单");
            steps.add("统计待处理服务请求");
            result.put("steps", steps);
            result.put("result", buildDashboard());
            return result;
        }

        // 客户+名称
        if (cmd.contains("客户")) {
            result.put("intent", "搜索客户");
            result.put("steps", Collections.singletonList("按关键词搜索客户"));
            result.put("result", "请在客户管理模块中使用搜索功能。输入「帮助」查看完整命令列表。");
            return result;
        }

        // 默认
        result.put("intent", "未识别");
        result.put("steps", Collections.emptyList());
        result.put("result", "抱歉，我还不理解" + cmd + "。输入「帮助」查看可用命令。");
        return result;
    }

    /**
     * RFM客户细分分析
     */
    public List<Map<String, Object>> rfmAnalysis() {
        // 查询所有客户（限制100条避免性能问题）
        LambdaQueryWrapper<Customer> customerWrapper = new LambdaQueryWrapper<>();
        customerWrapper.last("LIMIT 100");
        List<Customer> customers = customerMapper.selectList(customerWrapper);

        List<Map<String, Object>> results = new ArrayList<>();
        LocalDateTime now = LocalDateTime.now();

        for (Customer customer : customers) {
            Long customerId = customer.getId();

            // 查询该客户所有订单
            LambdaQueryWrapper<Order> orderWrapper = new LambdaQueryWrapper<>();
            orderWrapper.eq(Order::getCustomerId, customerId);
            List<Order> orders = orderMapper.selectList(orderWrapper);

            // R: 最近一次订单距今多少天（无订单则设为365天以上）
            long rDays;
            if (orders.isEmpty()) {
                rDays = 365;
            } else {
                LocalDateTime lastOrderDate = orders.stream()
                        .map(Order::getCreatedAt)
                        .filter(Objects::nonNull)
                        .max(LocalDateTime::compareTo)
                        .orElse(now.minusDays(365));
                rDays = ChronoUnit.DAYS.between(lastOrderDate, now);
            }

            // F: 订单频率（总订单数）
            int frequency = orders.size();

            // M: 消费金额
            BigDecimal monetary = orders.stream()
                    .map(Order::getTotalAmount)
                    .filter(Objects::nonNull)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            // 计算RFM评分（1-5分制）
            int rScore = scoreR(rDays);
            int fScore = scoreF(frequency);
            int mScore = scoreM(monetary);

            // 客户细分
            String segment = segment(rScore, fScore, mScore);

            Map<String, Object> item = new LinkedHashMap<>();
            item.put("customerId", customerId);
            item.put("customerName", customer.getName() != null ? customer.getName() : "未知");
            item.put("rScore", rScore);
            item.put("fScore", fScore);
            item.put("mScore", mScore);
            item.put("segment", segment);
            results.add(item);
        }

        return results;
    }

    /**
     * 销售预测
     */
    public Map<String, Object> salesForecast() {
        Map<String, Object> result = new LinkedHashMap<>();

        // 查询近12个月订单
        LocalDateTime twelveMonthsAgo = LocalDateTime.now().minusMonths(12);
        LambdaQueryWrapper<Order> orderWrapper = new LambdaQueryWrapper<>();
        orderWrapper.ge(Order::getCreatedAt, twelveMonthsAgo);
        List<Order> orders = orderMapper.selectList(orderWrapper);

        // 按月分组统计
        Map<YearMonth, BigDecimal> monthlyAmounts = new TreeMap<>();
        for (Order order : orders) {
            if (order.getCreatedAt() == null) continue;
            YearMonth month = YearMonth.from(order.getCreatedAt());
            BigDecimal amount = order.getTotalAmount() != null ? order.getTotalAmount() : BigDecimal.ZERO;
            monthlyAmounts.merge(month, amount, BigDecimal::add);
        }

        // 生成历史数据
        List<Map<String, Object>> history = new ArrayList<>();
        List<BigDecimal> recentValues = new ArrayList<>();

        LocalDate now = LocalDate.now();
        for (int i = 11; i >= 0; i--) {
            YearMonth month = YearMonth.from(now.minusMonths(i));
            BigDecimal amount = monthlyAmounts.getOrDefault(month, BigDecimal.ZERO);
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("month", month.toString());
            item.put("amount", amount);
            history.add(item);
            recentValues.add(amount);
        }

        // 简单移动平均预测未来3个月
        List<Map<String, Object>> forecast = new ArrayList<>();
        for (int i = 1; i <= 3; i++) {
            YearMonth forecastMonth = YearMonth.from(now.plusMonths(i));
            BigDecimal predicted;
            if (recentValues.size() >= 3) {
                // 取最近3个月平均值
                int size = recentValues.size();
                BigDecimal sum = recentValues.get(size - 1)
                        .add(recentValues.get(size - 2))
                        .add(recentValues.get(size - 3));
                predicted = sum.divide(new BigDecimal("3"), 2, RoundingMode.HALF_UP);
            } else {
                predicted = BigDecimal.ZERO;
            }
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("month", forecastMonth.toString());
            item.put("amount", predicted);
            forecast.add(item);
            recentValues.add(predicted);
        }

        result.put("history", history);
        result.put("forecast", forecast);

        return result;
    }

    /**
     * 今日优先跟进Top5
     */
    public List<Map<String, Object>> todayPriority() {
        List<Map<String, Object>> priorityList = new ArrayList<>();
        LocalDateTime now = LocalDateTime.now();

        // 1. 查询有过期跟进任务的客户（next_follow_at < now）
        LambdaQueryWrapper<Customer> overdueWrapper = new LambdaQueryWrapper<>();
        overdueWrapper.isNotNull(Customer::getNextFollowAt)
                      .lt(Customer::getNextFollowAt, now)
                      .orderByAsc(Customer::getNextFollowAt)
                      .last("LIMIT 10");
        List<Customer> overdueCustomers = customerMapper.selectList(overdueWrapper);

        for (Customer customer : overdueCustomers) {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("customerId", customer.getId());
            item.put("customerName", customer.getName() != null ? customer.getName() : "未知");
            item.put("reason", "跟进任务已逾期");
            item.put("priority", "高");
            item.put("lastFollowAt", customer.getLastFollowAt());
            priorityList.add(item);
        }

        // 2. 高价值客户无近期订单（高价值+无订单30天以上）
        LambdaQueryWrapper<Customer> highValueWrapper = new LambdaQueryWrapper<>();
        highValueWrapper.eq(Customer::getLevel, "高价值客户")
                        .last("LIMIT 10");
        List<Customer> highValueCustomers = customerMapper.selectList(highValueWrapper);

        for (Customer customer : highValueCustomers) {
            // 检查是否有近期订单
            LambdaQueryWrapper<Order> recentOrderWrapper = new LambdaQueryWrapper<>();
            recentOrderWrapper.eq(Order::getCustomerId, customer.getId())
                              .ge(Order::getCreatedAt, now.minusDays(30));
            Long recentOrderCount = orderMapper.selectCount(recentOrderWrapper);
            if (recentOrderCount == null || recentOrderCount == 0) {
                Map<String, Object> item = new LinkedHashMap<>();
                item.put("customerId", customer.getId());
                item.put("customerName", customer.getName() != null ? customer.getName() : "未知");
                item.put("reason", "高价值客户近30天无订单");
                item.put("priority", "高");
                item.put("lastFollowAt", customer.getLastFollowAt());
                priorityList.add(item);
            }
        }

        // 3. 有待处理服务请求的客户
        LambdaQueryWrapper<ServiceRequest> pendingWrapper = new LambdaQueryWrapper<>();
        pendingWrapper.eq(ServiceRequest::getStatus, "待处理")
                      .orderByAsc(ServiceRequest::getPriority)
                      .last("LIMIT 10");
        List<ServiceRequest> pendingRequests = serviceRequestMapper.selectList(pendingWrapper);

        for (ServiceRequest req : pendingRequests) {
            Customer customer = customerMapper.selectById(req.getCustomerId());
            if (customer != null) {
                Map<String, Object> item = new LinkedHashMap<>();
                item.put("customerId", customer.getId());
                item.put("customerName", customer.getName() != null ? customer.getName() : "未知");
                item.put("reason", "有待处理服务请求：" + (req.getTitle() != null ? req.getTitle() : "无标题"));
                item.put("priority", req.getPriority() != null ? req.getPriority() : "中");
                item.put("lastFollowAt", customer.getLastFollowAt());
                priorityList.add(item);
            }
        }

        // 按优先级排序：高 > 紧急 > 中 > 低，取前5
        priorityList.sort((a, b) -> {
            int pa = priorityOrder((String) a.getOrDefault("priority", "低"));
            int pb = priorityOrder((String) b.getOrDefault("priority", "低"));
            return Integer.compare(pb, pa);
        });

        return priorityList.stream().limit(5).collect(Collectors.toList());
    }

    // ---- 辅助方法 ----

    private String buildHelpMessage() {
        StringBuilder sb = new StringBuilder();
        sb.append("可用命令列表：\n");
        sb.append("1. [跟进]/[优先] - 查看今日需要优先跟进的客户\n");
        sb.append("2. [客户] + 姓名 - 搜索客户信息\n");
        sb.append("3. [统计]/[分析]/[仪表盘] - 查看业务仪表盘概览\n");
        sb.append("4. [今日]/[今天] - 查看今日日程和待办\n");
        sb.append("5. [预测] - 查看销售趋势预测\n");
        sb.append("6. [RFM]/[细分] - 查看RFM客户细分分析\n");
        sb.append("7. [帮助]/[help] - 显示此帮助信息");
        return sb.toString();
    }

    private Map<String, Object> buildDashboard() {
        Map<String, Object> dashboard = new LinkedHashMap<>();

        // 客户总数
        Long totalCustomers = customerMapper.selectCount(null);
        dashboard.put("totalCustomers", totalCustomers != null ? totalCustomers : 0);

        // 本月订单数和金额
        LocalDateTime monthStart = LocalDate.now().withDayOfMonth(1).atStartOfDay();
        LambdaQueryWrapper<Order> monthOrderWrapper = new LambdaQueryWrapper<>();
        monthOrderWrapper.ge(Order::getCreatedAt, monthStart);
        List<Order> monthOrders = orderMapper.selectList(monthOrderWrapper);
        int monthOrderCount = monthOrders.size();
        BigDecimal monthOrderAmount = monthOrders.stream()
                .map(o -> o.getTotalAmount() != null ? o.getTotalAmount() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        dashboard.put("monthOrderCount", monthOrderCount);
        dashboard.put("monthOrderAmount", monthOrderAmount);

        // 待处理服务请求
        LambdaQueryWrapper<ServiceRequest> pendingWrapper = new LambdaQueryWrapper<>();
        pendingWrapper.eq(ServiceRequest::getStatus, "待处理");
        Long pendingServiceCount = serviceRequestMapper.selectCount(pendingWrapper);
        dashboard.put("pendingServiceCount", pendingServiceCount != null ? pendingServiceCount : 0);

        // 逾期跟进客户数
        LambdaQueryWrapper<Customer> overdueWrapper = new LambdaQueryWrapper<>();
        overdueWrapper.isNotNull(Customer::getNextFollowAt)
                      .lt(Customer::getNextFollowAt, LocalDateTime.now());
        Long overdueCount = customerMapper.selectCount(overdueWrapper);
        dashboard.put("overdueFollowCount", overdueCount != null ? overdueCount : 0);

        return dashboard;
    }

    private int scoreR(long days) {
        if (days <= 7) return 5;
        if (days <= 30) return 4;
        if (days <= 90) return 3;
        if (days <= 180) return 2;
        return 1;
    }

    private int scoreF(int frequency) {
        if (frequency >= 10) return 5;
        if (frequency >= 6) return 4;
        if (frequency >= 3) return 3;
        if (frequency >= 1) return 2;
        return 1;
    }

    private int scoreM(BigDecimal monetary) {
        if (monetary.compareTo(new BigDecimal("100000")) >= 0) return 5;
        if (monetary.compareTo(new BigDecimal("50000")) >= 0) return 4;
        if (monetary.compareTo(new BigDecimal("10000")) >= 0) return 3;
        if (monetary.compareTo(BigDecimal.ZERO) > 0) return 2;
        return 1;
    }

    private String segment(int r, int f, int m) {
        int total = r + f + m;
        if (total >= 13) return "高价值客户";
        if (r >= 4 && f >= 4 && m <= 3) return "重点发展客户";
        if (r <= 3 && f >= 4 && m >= 4) return "重点保持客户";
        if (r <= 3 && f <= 3 && m >= 3) return "重点挽留客户";
        if (total >= 7) return "一般价值客户";
        return "流失客户";
    }

    private int priorityOrder(String priority) {
        switch (priority) {
            case "紧急": return 4;
            case "高": return 3;
            case "中": return 2;
            case "低": return 1;
            default: return 0;
        }
    }
}
