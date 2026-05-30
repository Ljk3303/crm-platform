package com.crm.module.receivable.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.crm.common.PageResult;
import com.crm.common.Result;
import com.crm.module.quotation.entity.Order;
import com.crm.module.quotation.mapper.OrderMapper;
import com.crm.module.receivable.entity.ReceivablePlan;
import com.crm.module.receivable.entity.ReceivableRecord;
import com.crm.module.receivable.mapper.ReceivablePlanMapper;
import com.crm.module.receivable.mapper.ReceivableRecordMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/receivables")
@RequiredArgsConstructor
public class ReceivableController {

    private final ReceivablePlanMapper receivablePlanMapper;
    private final ReceivableRecordMapper receivableRecordMapper;
    private final OrderMapper orderMapper;

    @GetMapping("/plans")
    public Result<PageResult<ReceivablePlan>> plans(
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(defaultValue = "10") Integer size,
            @RequestParam(required = false) Long orderId) {
        Page<ReceivablePlan> p = new Page<>(page, size);
        LambdaQueryWrapper<ReceivablePlan> wrapper = new LambdaQueryWrapper<>();
        if (orderId != null) wrapper.eq(ReceivablePlan::getOrderId, orderId);
        wrapper.orderByAsc(ReceivablePlan::getPlanDate);
        p = receivablePlanMapper.selectPage(p, wrapper);
        return Result.success(PageResult.of(p.getTotal(), page, size, p.getRecords()));
    }

    @PostMapping("/plans")
    public Result<ReceivablePlan> createPlan(@RequestBody ReceivablePlan plan) {
        plan.setCreatedAt(LocalDateTime.now());
        plan.setUpdatedAt(LocalDateTime.now());
        receivablePlanMapper.insert(plan);
        return Result.success(plan);
    }

    @GetMapping("/records")
    public Result<PageResult<ReceivableRecord>> records(
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(defaultValue = "10") Integer size,
            @RequestParam(required = false) Long orderId) {
        Page<ReceivableRecord> p = new Page<>(page, size);
        LambdaQueryWrapper<ReceivableRecord> wrapper = new LambdaQueryWrapper<>();
        if (orderId != null) wrapper.eq(ReceivableRecord::getOrderId, orderId);
        wrapper.orderByDesc(ReceivableRecord::getPaymentDate);
        p = receivableRecordMapper.selectPage(p, wrapper);
        return Result.success(PageResult.of(p.getTotal(), page, size, p.getRecords()));
    }

    @PostMapping("/records")
    public Result<ReceivableRecord> createRecord(@RequestBody ReceivableRecord record) {
        record.setCreatedAt(LocalDateTime.now());
        receivableRecordMapper.insert(record);

        // 更新订单已收金额
        if (record.getOrderId() != null) {
            Order order = orderMapper.selectById(record.getOrderId());
            if (order != null) {
                // 计算订单总已收金额
                LambdaQueryWrapper<ReceivableRecord> wrapper = new LambdaQueryWrapper<>();
                wrapper.eq(ReceivableRecord::getOrderId, record.getOrderId());
                List<ReceivableRecord> allRecords = receivableRecordMapper.selectList(wrapper);
                BigDecimal totalPaid = allRecords.stream()
                        .map(r -> r.getAmount() != null ? r.getAmount() : BigDecimal.ZERO)
                        .reduce(BigDecimal.ZERO, BigDecimal::add);
                // 如果已收金额 >= 订单总额，自动更新订单状态
                if (totalPaid.compareTo(order.getFinalAmount()) >= 0) {
                    order.setStatus(3); // paid
                    order.setUpdatedAt(LocalDateTime.now());
                }
                orderMapper.updateById(order);
            }
        }
        return Result.success(record);
    }

    @GetMapping("/overdue")
    public Result<List<ReceivablePlan>> overdue() {
        LambdaQueryWrapper<ReceivablePlan> wrapper = new LambdaQueryWrapper<>();
        wrapper.lt(ReceivablePlan::getPlanDate, LocalDate.now())
                .ne(ReceivablePlan::getStatus, "PAID")
                .orderByAsc(ReceivablePlan::getPlanDate);
        return Result.success(receivablePlanMapper.selectList(wrapper));
    }
}
