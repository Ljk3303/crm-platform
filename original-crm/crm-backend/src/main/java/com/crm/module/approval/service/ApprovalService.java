package com.crm.module.approval.service;

import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.crm.module.approval.entity.ApprovalFlow;
import com.crm.module.approval.entity.ApprovalRecord;
import com.crm.module.approval.mapper.ApprovalFlowMapper;
import com.crm.module.approval.mapper.ApprovalRecordMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ApprovalService {

    private final ApprovalFlowMapper approvalFlowMapper;
    private final ApprovalRecordMapper approvalRecordMapper;

    public List<ApprovalFlow> getFlows() {
        return approvalFlowMapper.selectList(
                Wrappers.<ApprovalFlow>lambdaQuery().eq(ApprovalFlow::getStatus, 1));
    }

    @Transactional
    public ApprovalFlow createFlow(ApprovalFlow flow) {
        flow.setStatus(1);
        flow.setCreatedAt(LocalDateTime.now());
        flow.setUpdatedAt(LocalDateTime.now());
        approvalFlowMapper.insert(flow);
        return flow;
    }

    @Transactional
    public ApprovalRecord submit(String businessType, Long businessId, Long flowId) {
        ApprovalRecord record = new ApprovalRecord();
        record.setFlowId(flowId);
        record.setBusinessType(businessType);
        record.setBusinessId(businessId);
        record.setCurrentStep(1);
        record.setAction("提交");
        record.setCreatedAt(LocalDateTime.now());
        approvalRecordMapper.insert(record);
        return record;
    }

    @Transactional
    public ApprovalRecord approve(Long recordId, Long approverId, String comment) {
        ApprovalRecord record = approvalRecordMapper.selectById(recordId);
        if (record != null) {
            record.setApproverId(approverId);
            record.setComment(comment);
            record.setAction("同意");
            record.setCreatedAt(LocalDateTime.now());
            approvalRecordMapper.updateById(record);
        }
        return record;
    }

    @Transactional
    public ApprovalRecord reject(Long recordId, Long approverId, String comment) {
        ApprovalRecord record = approvalRecordMapper.selectById(recordId);
        if (record != null) {
            record.setApproverId(approverId);
            record.setComment(comment);
            record.setAction("驳回");
            record.setCreatedAt(LocalDateTime.now());
            approvalRecordMapper.updateById(record);
        }
        return record;
    }

    public List<ApprovalRecord> getPending(Long approverId) {
        return approvalRecordMapper.selectList(
                Wrappers.<ApprovalRecord>lambdaQuery()
                        .eq(ApprovalRecord::getApproverId, approverId)
                        .ne(ApprovalRecord::getAction, "同意")
                        .ne(ApprovalRecord::getAction, "驳回")
                        .orderByDesc(ApprovalRecord::getCreatedAt));
    }

    public List<ApprovalRecord> getHistory(String businessType, Long businessId) {
        return approvalRecordMapper.selectList(
                Wrappers.<ApprovalRecord>lambdaQuery()
                        .eq(ApprovalRecord::getBusinessType, businessType)
                        .eq(ApprovalRecord::getBusinessId, businessId)
                        .orderByDesc(ApprovalRecord::getCreatedAt));
    }
}
