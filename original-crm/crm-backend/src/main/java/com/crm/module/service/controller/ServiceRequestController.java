package com.crm.module.service.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.crm.common.PageResult;
import com.crm.common.Result;
import com.crm.module.service.entity.ServiceRequest;
import com.crm.module.service.entity.ServiceTicket;
import com.crm.module.service.entity.ServiceVisit;
import com.crm.module.service.mapper.ServiceRequestMapper;
import com.crm.module.service.mapper.ServiceTicketMapper;
import com.crm.module.service.mapper.ServiceVisitMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/service-requests")
@RequiredArgsConstructor
public class ServiceRequestController {

    private final ServiceRequestMapper serviceRequestMapper;
    private final ServiceTicketMapper serviceTicketMapper;
    private final ServiceVisitMapper serviceVisitMapper;

    @GetMapping("/list")
    public Result<PageResult<ServiceRequest>> list(
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(defaultValue = "10") Integer size,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String priority,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Long customerId) {
        Page<ServiceRequest> p = new Page<>(page, size);
        LambdaQueryWrapper<ServiceRequest> wrapper = new LambdaQueryWrapper<>();
        if (type != null) wrapper.eq(ServiceRequest::getType, type);
        if (priority != null) wrapper.eq(ServiceRequest::getPriority, priority);
        if (status != null) wrapper.eq(ServiceRequest::getStatus, status);
        if (customerId != null) wrapper.eq(ServiceRequest::getCustomerId, customerId);
        wrapper.orderByDesc(ServiceRequest::getCreatedAt);
        p = serviceRequestMapper.selectPage(p, wrapper);
        return Result.ok(new PageResult(p.getTotal(), page, size, p.getRecords()));
    }

    @GetMapping("/{id}")
    public Result<ServiceRequest> getById(@PathVariable Long id) {
        return Result.ok(serviceRequestMapper.selectById(id));
    }

    @PostMapping
    public Result<ServiceRequest> create(@RequestBody ServiceRequest request) {
        request.setRequestNo("SR-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        if (request.getStatus() == null) request.setStatus("PENDING");
        request.setCreatedAt(LocalDateTime.now());
        request.setUpdatedAt(LocalDateTime.now());
        serviceRequestMapper.insert(request);
        return Result.ok(request);
    }

    @PutMapping
    public Result<ServiceRequest> update(@RequestBody ServiceRequest request) {
        request.setUpdatedAt(LocalDateTime.now());
        serviceRequestMapper.updateById(request);
        return Result.ok(request);
    }

    @PostMapping("/{id}/ticket")
    public Result<ServiceTicket> createTicket(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        ServiceTicket ticket = new ServiceTicket();
        ticket.setRequestId(id);
        ticket.setTitle((String) body.get("title"));
        ticket.setDescription((String) body.get("description"));
        ticket.setAssigneeId(body.get("assigneeId") != null ? Long.valueOf(body.get("assigneeId").toString()) : null);
        ticket.setTicketNo("TK-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        ticket.setStatus("OPEN");
        ticket.setCreatedAt(LocalDateTime.now());
        ticket.setUpdatedAt(LocalDateTime.now());
        serviceTicketMapper.insert(ticket);
        return Result.ok(ticket);
    }

    @GetMapping("/{id}/tickets")
    public Result<List<ServiceTicket>> getTickets(@PathVariable Long id) {
        LambdaQueryWrapper<ServiceTicket> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(ServiceTicket::getRequestId, id);
        return Result.ok(serviceTicketMapper.selectList(wrapper));
    }

    @PutMapping("/{id}/satisfaction")
    public Result<Void> setSatisfaction(@PathVariable Long id, @RequestBody Map<String, Integer> body) {
        ServiceRequest request = serviceRequestMapper.selectById(id);
        if (request != null) {
            request.setSatisfactionScore(body.get("satisfactionScore"));
            request.setUpdatedAt(LocalDateTime.now());
            serviceRequestMapper.updateById(request);
        }
        return Result.ok();
    }

    @PostMapping("/{id}/visit-plan")
    public Result<ServiceVisit> createVisitPlan(@PathVariable Long id, @RequestBody ServiceVisit visit) {
        visit.setRequestId(id);
        visit.setCreatedAt(LocalDateTime.now());
        visit.setUpdatedAt(LocalDateTime.now());
        serviceVisitMapper.insert(visit);
        return Result.ok(visit);
    }

    @GetMapping("/{id}/visit-plans")
    public Result<List<ServiceVisit>> getVisitPlans(@PathVariable Long id) {
        LambdaQueryWrapper<ServiceVisit> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(ServiceVisit::getRequestId, id);
        return Result.ok(serviceVisitMapper.selectList(wrapper));
    }
}
