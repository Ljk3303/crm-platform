package com.crm.module.service.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.crm.common.PageResult;
import com.crm.module.service.entity.*;
import com.crm.module.service.mapper.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ServiceRequestService {

    private final ServiceRequestMapper serviceRequestMapper;
    private final ServiceTicketMapper serviceTicketMapper;
    private final ServiceTicketLogMapper serviceTicketLogMapper;
    private final ServiceVisitMapper serviceVisitMapper;

    public PageResult<ServiceRequest> list(Integer page, Integer size, String type, String priority, String status, Long customerId) {
        Page<ServiceRequest> p = new Page<>(page, size);
        LambdaQueryWrapper<ServiceRequest> wrapper = Wrappers.lambdaQuery();
        if (StringUtils.hasText(type)) wrapper.eq(ServiceRequest::getType, type);
        if (StringUtils.hasText(priority)) wrapper.eq(ServiceRequest::getPriority, priority);
        if (StringUtils.hasText(status)) wrapper.eq(ServiceRequest::getStatus, status);
        if (customerId != null) wrapper.eq(ServiceRequest::getCustomerId, customerId);
        wrapper.orderByDesc(ServiceRequest::getCreatedAt);
        Page<ServiceRequest> result = serviceRequestMapper.selectPage(p, wrapper);
        return new PageResult(result.getTotal(), page, size, result.getRecords());
    }

    public ServiceRequest getById(Long id) {
        return serviceRequestMapper.selectById(id);
    }

    @Transactional
    public ServiceRequest create(ServiceRequest request) {
        request.setRequestNo("SR" + System.currentTimeMillis());
        request.setStatus("待处理");
        request.setCreatedAt(LocalDateTime.now());
        request.setUpdatedAt(LocalDateTime.now());
        serviceRequestMapper.insert(request);
        return request;
    }

    @Transactional
    public ServiceRequest update(ServiceRequest request) {
        request.setUpdatedAt(LocalDateTime.now());
        serviceRequestMapper.updateById(request);
        return request;
    }

    @Transactional
    public ServiceTicket createTicket(Long requestId, ServiceTicket ticket) {
        ticket.setRequestId(requestId);
        ticket.setTicketNo("ST" + System.currentTimeMillis());
        ticket.setStatus("待处理");
        ticket.setCreatedAt(LocalDateTime.now());
        ticket.setUpdatedAt(LocalDateTime.now());
        serviceTicketMapper.insert(ticket);
        return ticket;
    }

    public List<ServiceTicket> getTickets(Long requestId) {
        return serviceTicketMapper.selectList(
                Wrappers.<ServiceTicket>lambdaQuery().eq(ServiceTicket::getRequestId, requestId).orderByDesc(ServiceTicket::getCreatedAt));
    }

    @Transactional
    public void setSatisfaction(Long id, Integer score) {
        ServiceRequest request = serviceRequestMapper.selectById(id);
        if (request != null) {
            request.setSatisfactionScore(score);
            request.setUpdatedAt(LocalDateTime.now());
            serviceRequestMapper.updateById(request);
        }
    }

    @Transactional
    public ServiceVisit createVisitPlan(Long requestId, ServiceVisit visit) {
        visit.setRequestId(requestId);
        visit.setStatus("待回访");
        visit.setCreatedAt(LocalDateTime.now());
        visit.setUpdatedAt(LocalDateTime.now());
        serviceVisitMapper.insert(visit);
        return visit;
    }

    public List<ServiceVisit> getVisitPlans(Long requestId) {
        return serviceVisitMapper.selectList(
                Wrappers.<ServiceVisit>lambdaQuery().eq(ServiceVisit::getRequestId, requestId).orderByDesc(ServiceVisit::getCreatedAt));
    }
}
