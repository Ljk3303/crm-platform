package com.crm.module.lead.controller;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.crm.common.PageResult;
import com.crm.common.Result;
import com.crm.module.lead.entity.Lead;
import com.crm.module.lead.entity.LeadFollowUp;
import com.crm.module.lead.service.LeadService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/leads")
@RequiredArgsConstructor
public class LeadController {

    private final LeadService leadService;

    @GetMapping("/list")
    public Result<PageResult<Lead>> list(
            @RequestParam(defaultValue = "1") long page,
            @RequestParam(defaultValue = "10") long size,
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String source,
            @RequestParam(required = false) Integer status) {
        IPage<Lead> result = leadService.list(page, size, name, source, status);
        return Result.ok(new PageResult(result.getTotal(), (int) result.getCurrent(), (int) result.getSize(), result.getRecords()));
    }

    @GetMapping("/{id}")
    public Result<Lead> getById(@PathVariable Long id) {
        Lead lead = leadService.getById(id);
        return Result.ok(lead);
    }

    @PostMapping
    public Result<Lead> create(@RequestBody Lead lead) {
        return Result.ok(leadService.create(lead));
    }

    @PutMapping
    public Result<Lead> update(@RequestBody Lead lead) {
        return Result.ok(leadService.update(lead));
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        leadService.delete(id);
        return Result.ok();
    }

    @PostMapping("/convert/{id}")
    public Result<Lead> convert(@PathVariable Long id) {
        return Result.ok(leadService.convertToCustomerAndOpportunity(id));
    }

    @PostMapping("/follow")
    public Result<LeadFollowUp> follow(@RequestBody LeadFollowUp followUp) {
        return Result.ok(leadService.addFollowUp(followUp));
    }

    @GetMapping("/{id}/follows")
    public Result<List<LeadFollowUp>> getFollowUps(@PathVariable Long id) {
        return Result.ok(leadService.getFollowUps(id));
    }

    @PutMapping("/assign")
    public Result<Void> assign(@RequestBody Map<String, Long> body) {
        Long leadId = body.get("leadId");
        Long ownerId = body.get("ownerId");
        leadService.assign(leadId, ownerId);
        return Result.ok();
    }

    @GetMapping("/pool")
    public Result<PageResult<Lead>> pool(
            @RequestParam(defaultValue = "1") long page,
            @RequestParam(defaultValue = "10") long size) {
        IPage<Lead> result = leadService.getPool(page, size);
        return Result.ok(new PageResult(result.getTotal(), (int) result.getCurrent(), (int) result.getSize(), result.getRecords()));
    }
}
