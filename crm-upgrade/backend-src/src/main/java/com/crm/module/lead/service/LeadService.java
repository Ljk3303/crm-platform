package com.crm.module.lead.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.crm.module.customer.entity.Customer;
import com.crm.module.customer.mapper.CustomerMapper;
import com.crm.module.lead.entity.Lead;
import com.crm.module.lead.entity.LeadFollowUp;
import com.crm.module.lead.mapper.LeadFollowUpMapper;
import com.crm.module.lead.mapper.LeadMapper;
import com.crm.module.opportunity.entity.Opportunity;
import com.crm.module.opportunity.mapper.OpportunityMapper;
import com.crm.module.contact.entity.Contact;
import com.crm.module.contact.mapper.ContactMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * 线索管理服务
 * 线索状态: 0=新建, 1=已联系, 2=已转化, 3=无效
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class LeadService {

    /** 新建 */
    private static final int STATUS_NEW = 0;
    /** 已转化 */
    private static final int STATUS_CONVERTED = 2;

    private final LeadMapper leadMapper;
    private final LeadFollowUpMapper leadFollowUpMapper;
    private final CustomerMapper customerMapper;
    private final OpportunityMapper opportunityMapper;
    private final ContactMapper contactMapper;

    /**
     * 分页查询线索列表，支持按名称、来源、状态筛选
     */
    public IPage<Lead> list(long page, long size, String name, String source, Integer status) {
        LambdaQueryWrapper<Lead> wrapper = new LambdaQueryWrapper<>();
        if (StringUtils.hasText(name)) {
            wrapper.like(Lead::getName, name);
        }
        if (StringUtils.hasText(source)) {
            wrapper.eq(Lead::getSource, source);
        }
        if (status != null) {
            wrapper.eq(Lead::getStatus, status);
        }
        wrapper.orderByDesc(Lead::getCreatedAt);
        return leadMapper.selectPage(new Page<>(page, size), wrapper);
    }

    /**
     * 按ID查询线索详情
     */
    public Lead getById(Long id) {
        Lead lead = leadMapper.selectById(id);
        if (lead == null) {
            throw new RuntimeException("线索不存在");
        }
        return lead;
    }

    /**
     * 创建线索
     */
    public Lead create(Lead lead) {
        lead.setStatus(STATUS_NEW);
        lead.setFollowCount(0);
        lead.setCreatedAt(LocalDateTime.now());
        lead.setUpdatedAt(LocalDateTime.now());
        leadMapper.insert(lead);
        log.info("创建线索: id={}, name={}", lead.getId(), lead.getName());
        return lead;
    }

    /**
     * 更新线索
     */
    public Lead update(Lead lead) {
        Lead existing = leadMapper.selectById(lead.getId());
        if (existing == null) {
            throw new RuntimeException("线索不存在");
        }
        lead.setUpdatedAt(LocalDateTime.now());
        leadMapper.updateById(lead);
        return leadMapper.selectById(lead.getId());
    }

    /**
     * 删除线索
     */
    public void delete(Long id) {
        Lead lead = leadMapper.selectById(id);
        if (lead == null) {
            throw new RuntimeException("线索不存在");
        }
        // 删除关联的跟进记录
        LambdaQueryWrapper<LeadFollowUp> followUpWrapper = new LambdaQueryWrapper<>();
        followUpWrapper.eq(LeadFollowUp::getLeadId, id);
        leadFollowUpMapper.delete(followUpWrapper);
        // 删除线索
        leadMapper.deleteById(id);
        log.info("删除线索: id={}", id);
    }

    /**
     * 线索转化：将线索转为客户和商机
     * 1. 创建客户（线索名称→客户名称，线索手机→客户手机）
     * 2. 创建商机（关联新创建的客户）
     * 3. 更新线索状态为已转化，记录转化ID
     */
    @Transactional
    public Lead convertToCustomerAndOpportunity(Long leadId) {
        Lead lead = leadMapper.selectById(leadId);
        if (lead == null) {
            throw new RuntimeException("线索不存在");
        }
        if (lead.getStatus() != null && lead.getStatus() == STATUS_CONVERTED) {
            throw new RuntimeException("线索已转化，不可重复转化");
        }

        // 1. 创建客户
        Customer customer = new Customer();
        customer.setName(lead.getCompanyName() != null ? lead.getCompanyName() : lead.getName());
        customer.setPhone(lead.getContactPhone());
        customer.setEmail(lead.getContactEmail());
        customer.setIndustry(lead.getIndustry());
        customer.setSource(lead.getSource());
        customer.setDescription(lead.getDescription());
        customer.setOwnerId(lead.getOwnerId());
        customer.setStatus(1);
        customer.setCreatedAt(LocalDateTime.now());
        customer.setUpdatedAt(LocalDateTime.now());
        customerMapper.insert(customer);
        log.info("线索转化-创建客户: id={}, name={}", customer.getId(), customer.getName());

        // 2. 如果线索有联系人信息，创建联系人
        if (StringUtils.hasText(lead.getContactName())) {
            Contact contact = new Contact();
            contact.setCustomerId(customer.getId());
            contact.setName(lead.getContactName());
            contact.setPhone(lead.getContactPhone());
            contact.setEmail(lead.getContactEmail());
            contact.setCreatedBy(lead.getOwnerId());
            contact.setCreatedAt(LocalDateTime.now());
            contact.setUpdatedAt(LocalDateTime.now());
            contactMapper.insert(contact);
            log.info("线索转化-创建联系人: id={}, name={}", contact.getId(), contact.getName());
        }

        // 3. 创建商机
        Opportunity opportunity = new Opportunity();
        opportunity.setName(lead.getName() + " - 线索转化");
        opportunity.setCustomerId(customer.getId());
        opportunity.setAmount(BigDecimal.ZERO);
        opportunity.setStage("初步接触");
        opportunity.setStageOrder(1);
        opportunity.setProbability(10);
        opportunity.setDescription(lead.getDescription());
        opportunity.setOwnerId(lead.getOwnerId());
        opportunity.setLeadId(leadId);
        opportunityMapper.insert(opportunity);
        log.info("线索转化-创建商机: id={}, name={}", opportunity.getId(), opportunity.getName());

        // 4. 更新线索
        lead.setConvertCustomerId(customer.getId());
        lead.setConvertOpportunityId(opportunity.getId());
        lead.setStatus(STATUS_CONVERTED);
        lead.setUpdatedAt(LocalDateTime.now());
        leadMapper.updateById(lead);
        log.info("线索已转化: leadId={}, customerId={}, opportunityId={}", leadId, customer.getId(), opportunity.getId());

        return lead;
    }

    /**
     * 添加跟进记录
     */
    public LeadFollowUp addFollowUp(LeadFollowUp followUp) {
        Lead lead = leadMapper.selectById(followUp.getLeadId());
        if (lead == null) {
            throw new RuntimeException("线索不存在");
        }

        followUp.setCreatedAt(LocalDateTime.now());
        leadFollowUpMapper.insert(followUp);

        // 更新线索的跟进次数和最后跟进时间
        lead.setFollowCount((lead.getFollowCount() == null ? 0 : lead.getFollowCount()) + 1);
        lead.setLastFollowAt(LocalDateTime.now());
        // 设置下次跟进计划
        if (StringUtils.hasText(followUp.getNextPlan())) {
            lead.setNextFollowAt(LocalDateTime.now().plusDays(7));
        }
        lead.setUpdatedAt(LocalDateTime.now());
        leadMapper.updateById(lead);

        return followUp;
    }

    /**
     * 查询线索的跟进记录
     */
    public List<LeadFollowUp> getFollowUps(Long leadId) {
        LambdaQueryWrapper<LeadFollowUp> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(LeadFollowUp::getLeadId, leadId).orderByDesc(LeadFollowUp::getCreatedAt);
        return leadFollowUpMapper.selectList(wrapper);
    }

    /**
     * 分配线索负责人
     */
    public void assign(Long leadId, Long ownerId) {
        Lead lead = leadMapper.selectById(leadId);
        if (lead == null) {
            throw new RuntimeException("线索不存在");
        }
        lead.setOwnerId(ownerId);
        lead.setUpdatedAt(LocalDateTime.now());
        leadMapper.updateById(lead);
        log.info("线索分配: leadId={}, ownerId={}", leadId, ownerId);
    }

    /**
     * 查询线索池（未分配的线索）
     */
    public IPage<Lead> getPool(long page, long size) {
        LambdaQueryWrapper<Lead> wrapper = new LambdaQueryWrapper<>();
        wrapper.isNull(Lead::getOwnerId).or().eq(Lead::getOwnerId, 0L);
        wrapper.orderByDesc(Lead::getCreatedAt);
        return leadMapper.selectPage(new Page<>(page, size), wrapper);
    }
}
