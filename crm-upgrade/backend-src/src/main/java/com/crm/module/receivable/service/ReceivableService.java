package com.crm.module.receivable.service;

import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.crm.module.receivable.entity.ReceivablePlan;
import com.crm.module.receivable.entity.ReceivableRecord;
import com.crm.module.receivable.mapper.ReceivablePlanMapper;
import com.crm.module.receivable.mapper.ReceivableRecordMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ReceivableService {

    private final ReceivablePlanMapper receivablePlanMapper;
    private final ReceivableRecordMapper receivableRecordMapper;

    public List<ReceivablePlan> getPlans(Long orderId) {
        return receivablePlanMapper.selectList(
                Wrappers.<ReceivablePlan>lambdaQuery().eq(ReceivablePlan::getOrderId, orderId).orderByAsc(ReceivablePlan::getPlanDate));
    }

    @Transactional
    public ReceivablePlan createPlan(ReceivablePlan plan) {
        plan.setStatus("待收款");
        plan.setCreatedAt(LocalDateTime.now());
        plan.setUpdatedAt(LocalDateTime.now());
        receivablePlanMapper.insert(plan);
        return plan;
    }

    public List<ReceivableRecord> getRecords(Long orderId) {
        return receivableRecordMapper.selectList(
                Wrappers.<ReceivableRecord>lambdaQuery().eq(ReceivableRecord::getOrderId, orderId).orderByDesc(ReceivableRecord::getCreatedAt));
    }

    @Transactional
    public ReceivableRecord recordPayment(ReceivableRecord record) {
        record.setPaymentDate(LocalDate.now());
        record.setCreatedAt(LocalDateTime.now());
        receivableRecordMapper.insert(record);

        if (record.getPlanId() != null) {
            ReceivablePlan plan = receivablePlanMapper.selectById(record.getPlanId());
            if (plan != null) {
                plan.setStatus("已收款");
                plan.setUpdatedAt(LocalDateTime.now());
                receivablePlanMapper.updateById(plan);
            }
        }
        return record;
    }

    public List<ReceivablePlan> getOverdue() {
        return receivablePlanMapper.selectList(
                Wrappers.<ReceivablePlan>lambdaQuery()
                        .eq(ReceivablePlan::getStatus, "待收款")
                        .lt(ReceivablePlan::getPlanDate, LocalDate.now()));
    }
}
