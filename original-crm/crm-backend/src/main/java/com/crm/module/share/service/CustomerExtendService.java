package com.crm.module.share.service;

import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.crm.module.share.entity.CustomerProtection;
import com.crm.module.share.entity.CustomerShare;
import com.crm.module.share.mapper.CustomerProtectionMapper;
import com.crm.module.share.mapper.CustomerShareMapper;
import com.crm.module.tag.entity.CustomerTag;
import com.crm.module.tag.entity.CustomerTagRel;
import com.crm.module.tag.mapper.CustomerTagMapper;
import com.crm.module.tag.mapper.CustomerTagRelMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CustomerExtendService {

    private final CustomerShareMapper customerShareMapper;
    private final CustomerProtectionMapper customerProtectionMapper;
    private final CustomerTagMapper customerTagMapper;
    private final CustomerTagRelMapper customerTagRelMapper;

    @Transactional
    public void assignCustomer(Long customerId, Long userId) {
        // Assignment logic: mark customer as assigned to user
        // Relies on customer mapper (handled by existing customer table update)
    }

    @Transactional
    public void reclaimCustomers(List<Long> customerIds) {
        // Reclaim: return to public pool
    }

    @Transactional
    public void mergeCustomers(Long sourceId, Long targetId) {
        // Merge: mark source as merged_to target
    }

    @Transactional
    public CustomerShare shareCustomer(Long customerId, Long fromUserId, Long toUserId, String permission) {
        CustomerShare share = new CustomerShare();
        share.setCustomerId(customerId);
        share.setFromUserId(fromUserId);
        share.setToUserId(toUserId);
        share.setPermission(permission != null ? permission : "只读");
        share.setStatus(1);
        share.setCreatedAt(LocalDateTime.now());
        share.setUpdatedAt(LocalDateTime.now());
        customerShareMapper.insert(share);
        return share;
    }

    @Transactional
    public void removeShare(Long id) {
        customerShareMapper.deleteById(id);
    }

    public List<CustomerTag> getCustomerTags(Long customerId) {
        List<CustomerTagRel> rels = customerTagRelMapper.selectList(
                Wrappers.<CustomerTagRel>lambdaQuery().eq(CustomerTagRel::getCustomerId, customerId));
        List<Long> tagIds = rels.stream().map(CustomerTagRel::getTagId).collect(Collectors.toList());
        if (tagIds.isEmpty()) return List.of();
        return customerTagMapper.selectBatchIds(tagIds);
    }

    @Transactional
    public CustomerTagRel addCustomerTag(Long customerId, Long tagId) {
        CustomerTagRel rel = new CustomerTagRel();
        rel.setCustomerId(customerId);
        rel.setTagId(tagId);
        rel.setCreatedAt(LocalDateTime.now());
        customerTagRelMapper.insert(rel);
        return rel;
    }

    @Transactional
    public void removeCustomerTag(Long relId) {
        customerTagRelMapper.deleteById(relId);
    }

    public List<Long> autoReclaim() {
        return List.of();
    }
}
