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
public class ServiceTicketService {

    private final ServiceTicketMapper serviceTicketMapper;
    private final ServiceTicketLogMapper serviceTicketLogMapper;

    public PageResult<ServiceTicket> list(Integer page, Integer size, String status, Long assigneeId) {
        Page<ServiceTicket> p = new Page<>(page, size);
        LambdaQueryWrapper<ServiceTicket> wrapper = Wrappers.lambdaQuery();
        if (StringUtils.hasText(status)) wrapper.eq(ServiceTicket::getStatus, status);
        if (assigneeId != null) wrapper.eq(ServiceTicket::getAssigneeId, assigneeId);
        wrapper.orderByDesc(ServiceTicket::getCreatedAt);
        Page<ServiceTicket> result = serviceTicketMapper.selectPage(p, wrapper);
        return PageResult.of(result.getTotal(), page, size, result.getRecords());
    }

    public ServiceTicket getById(Long id) {
        return serviceTicketMapper.selectById(id);
    }

    @Transactional
    public ServiceTicket create(ServiceTicket ticket) {
        ticket.setTicketNo("ST" + System.currentTimeMillis());
        ticket.setStatus("待处理");
        ticket.setCreatedAt(LocalDateTime.now());
        ticket.setUpdatedAt(LocalDateTime.now());
        serviceTicketMapper.insert(ticket);
        return ticket;
    }

    @Transactional
    public void assign(Long id, Long assigneeId) {
        ServiceTicket ticket = serviceTicketMapper.selectById(id);
        if (ticket != null) {
            ticket.setAssigneeId(assigneeId);
            ticket.setStatus("处理中");
            ticket.setUpdatedAt(LocalDateTime.now());
            serviceTicketMapper.updateById(ticket);
            addLog(id, "分配", "分配给员工ID: " + assigneeId);
        }
    }

    @Transactional
    public void updateStatus(Long id, String status) {
        ServiceTicket ticket = serviceTicketMapper.selectById(id);
        if (ticket != null) {
            ticket.setStatus(status);
            ticket.setUpdatedAt(LocalDateTime.now());
            serviceTicketMapper.updateById(ticket);
            addLog(id, "状态变更", "状态变更为: " + status);
        }
    }

    @Transactional
    public ServiceTicketLog addLog(Long ticketId, String actionType, String content) {
        ServiceTicketLog log = new ServiceTicketLog();
        log.setTicketId(ticketId);
        log.setActionType(actionType);
        log.setContent(content);
        log.setCreatedAt(LocalDateTime.now());
        serviceTicketLogMapper.insert(log);
        return log;
    }

    @Transactional
    public void complete(Long id, String resolution) {
        ServiceTicket ticket = serviceTicketMapper.selectById(id);
        if (ticket != null) {
            ticket.setStatus("已完成");
            ticket.setResolution(resolution);
            ticket.setEndAt(LocalDateTime.now());
            ticket.setUpdatedAt(LocalDateTime.now());
            serviceTicketMapper.updateById(ticket);
            addLog(id, "完成", "工单完成: " + resolution);
        }
    }

    public List<ServiceTicketLog> getLogs(Long ticketId) {
        return serviceTicketLogMapper.selectList(
                Wrappers.<ServiceTicketLog>lambdaQuery().eq(ServiceTicketLog::getTicketId, ticketId).orderByDesc(ServiceTicketLog::getCreatedAt));
    }
}
