package com.crm.module.approval.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.crm.common.Result;
import com.crm.module.approval.entity.ApprovalFlow;
import com.crm.module.approval.entity.ApprovalRecord;
import com.crm.module.approval.mapper.ApprovalFlowMapper;
import com.crm.module.approval.mapper.ApprovalRecordMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/approvals")
@RequiredArgsConstructor
public class ApprovalController {

    private final ApprovalFlowMapper approvalFlowMapper;
    private final ApprovalRecordMapper approvalRecordMapper;

    @GetMapping("/flows")
    public Result<List<ApprovalFlow>> flows() {
        return Result.success(approvalFlowMapper.selectList(null));
    }

    @PostMapping("/flows")
    public Result<ApprovalFlow> createFlow(@RequestBody ApprovalFlow flow) {
        flow.setCreatedAt(LocalDateTime.now());
        flow.setUpdatedAt(LocalDateTime.now());
        approvalFlowMapper.insert(flow);
        return Result.success(flow);
    }

    @PostMapping("/submit")
    public Result<ApprovalRecord> submit(@RequestBody Map<String, Object> body) {
        ApprovalRecord record = new ApprovalRecord();
        record.setBusinessType((String) body.get("businessType"));
        record.setBusinessId(body.get("businessId") != null ? Long.valueOf(body.get("businessId").toString()) : null);
        record.setCurrentStep(0);
        record.setAction("SUBMIT");
        record.setCreatedAt(LocalDateTime.now());
        approvalRecordMapper.insert(record);
        return Result.success(record);
    }

    @PostMapping("/approve")
    public Result<Void> approve(@RequestBody Map<String, Object> body) {
        Long recordId = body.get("recordId") != null ? Long.valueOf(body.get("recordId").toString()) : null;
        if (recordId != null) {
            ApprovalRecord record = approvalRecordMapper.selectById(recordId);
            if (record != null) {
                record.setAction("APPROVE");
                record.setComment((String) body.get("comment"));
                record.setCurrentStep((record.getCurrentStep() == null ? 0 : record.getCurrentStep()) + 1);
                approvalRecordMapper.updateById(record);
            }
        }
        return Result.success();
    }

    @PostMapping("/reject")
    public Result<Void> reject(@RequestBody Map<String, Object> body) {
        Long recordId = body.get("recordId") != null ? Long.valueOf(body.get("recordId").toString()) : null;
        if (recordId != null) {
            ApprovalRecord record = approvalRecordMapper.selectById(recordId);
            if (record != null) {
                record.setAction("REJECT");
                record.setComment((String) body.get("comment"));
                approvalRecordMapper.updateById(record);
            }
        }
        return Result.success();
    }

    @GetMapping("/pending")
    public Result<List<ApprovalRecord>> pending() {
        LambdaQueryWrapper<ApprovalRecord> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(ApprovalRecord::getAction, "SUBMIT");
        return Result.success(approvalRecordMapper.selectList(wrapper));
    }

    @GetMapping("/history/{businessType}/{businessId}")
    public Result<List<ApprovalRecord>> history(@PathVariable String businessType, @PathVariable Long businessId) {
        LambdaQueryWrapper<ApprovalRecord> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(ApprovalRecord::getBusinessType, businessType)
                .eq(ApprovalRecord::getBusinessId, businessId)
                .orderByDesc(ApprovalRecord::getCreatedAt);
        return Result.success(approvalRecordMapper.selectList(wrapper));
    }
}
