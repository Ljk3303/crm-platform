package com.crm.module.service.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.crm.common.PageResult;
import com.crm.common.Result;
import com.crm.module.service.entity.ServiceTicket;
import com.crm.module.service.entity.ServiceTicketLog;
import com.crm.module.service.mapper.ServiceTicketLogMapper;
import com.crm.module.service.mapper.ServiceTicketMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/service-tickets")
@RequiredArgsConstructor
public class ServiceTicketController {

    private final ServiceTicketMapper serviceTicketMapper;
    private final ServiceTicketLogMapper serviceTicketLogMapper;

    @GetMapping("/list")
    public Result<PageResult<ServiceTicket>> list(
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(defaultValue = "10") Integer size,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Long assigneeId) {
        Page<ServiceTicket> p = new Page<>(page, size);
        LambdaQueryWrapper<ServiceTicket> wrapper = new LambdaQueryWrapper<>();
        if (status != null) wrapper.eq(ServiceTicket::getStatus, status);
        if (assigneeId != null) wrapper.eq(ServiceTicket::getAssigneeId, assigneeId);
        wrapper.orderByDesc(ServiceTicket::getCreatedAt);
        p = serviceTicketMapper.selectPage(p, wrapper);
        return Result.ok(new PageResult(p.getTotal(), page, size, p.getRecords()));
    }

    @GetMapping("/{id}")
    public Result<Map<String, Object>> getById(@PathVariable Long id) {
        ServiceTicket ticket = serviceTicketMapper.selectById(id);
        LambdaQueryWrapper<ServiceTicketLog> logWrapper = new LambdaQueryWrapper<>();
        logWrapper.eq(ServiceTicketLog::getTicketId, id).orderByDesc(ServiceTicketLog::getCreatedAt);
        List<ServiceTicketLog> logs = serviceTicketLogMapper.selectList(logWrapper);
        return Result.ok(Map.of("ticket", ticket, "logs", logs));
    }

    @PutMapping("/{id}/assign")
    public Result<Void> assign(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        ServiceTicket ticket = serviceTicketMapper.selectById(id);
        if (ticket != null) {
            ticket.setAssigneeId(body.get("assigneeId") != null ? Long.valueOf(body.get("assigneeId").toString()) : null);
            ticket.setStatus("IN_PROGRESS");
            ticket.setUpdatedAt(LocalDateTime.now());
            serviceTicketMapper.updateById(ticket);
        }
        return Result.ok();
    }

    @PutMapping("/{id}/status")
    public Result<Void> updateStatus(@PathVariable Long id, @RequestBody Map<String, String> body) {
        ServiceTicket ticket = serviceTicketMapper.selectById(id);
        if (ticket != null) {
            ticket.setStatus(body.get("status"));
            ticket.setUpdatedAt(LocalDateTime.now());
            serviceTicketMapper.updateById(ticket);
        }
        String content = body.get("content");
        if (content != null) {
            ServiceTicketLog log = new ServiceTicketLog();
            log.setTicketId(id);
            log.setActionType("STATUS_CHANGE");
            log.setContent(content);
            log.setCreatedAt(LocalDateTime.now());
            serviceTicketLogMapper.insert(log);
        }
        return Result.ok();
    }

    @PostMapping("/{id}/log")
    public Result<ServiceTicketLog> addLog(@PathVariable Long id, @RequestBody ServiceTicketLog log) {
        log.setTicketId(id);
        log.setCreatedAt(LocalDateTime.now());
        serviceTicketLogMapper.insert(log);
        return Result.ok(log);
    }

    @PutMapping("/{id}/complete")
    public Result<Void> complete(@PathVariable Long id, @RequestBody Map<String, String> body) {
        ServiceTicket ticket = serviceTicketMapper.selectById(id);
        if (ticket != null) {
            ticket.setStatus("COMPLETED");
            ticket.setResolution(body.get("resolution"));
            ticket.setEndAt(LocalDateTime.now());
            ticket.setUpdatedAt(LocalDateTime.now());
            serviceTicketMapper.updateById(ticket);
        }
        return Result.ok();
    }
}
