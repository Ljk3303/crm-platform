package com.crm.module.opportunity.controller;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.crm.common.PageResult;
import com.crm.common.Result;
import com.crm.module.opportunity.entity.*;
import com.crm.module.opportunity.service.OpportunityService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/opportunities")
@RequiredArgsConstructor
public class OpportunityController {

    private final OpportunityService opportunityService;

    @GetMapping("/list")
    public Result<PageResult<Opportunity>> list(
            @RequestParam(defaultValue = "1") long page,
            @RequestParam(defaultValue = "10") long size,
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String stage,
            @RequestParam(required = false) Long customerId) {
        IPage<Opportunity> result = opportunityService.list(page, size, name, stage, customerId);
        return Result.ok(new PageResult(result.getTotal(), (int) result.getCurrent(), (int) result.getSize(), result.getRecords()));
    }

    @GetMapping("/{id}")
    public Result<Map<String, Object>> getById(@PathVariable Long id) {
        Opportunity opportunity = opportunityService.getById(id);
        List<OpportunityTeam> team = opportunityService.getTeam(id);
        List<OpportunityCompetitor> competitors = opportunityService.getCompetitors(id);
        List<OpportunityStageLog> stageLogs = opportunityService.getStageLogs(id);

        Map<String, Object> detail = new java.util.LinkedHashMap<>();
        detail.put("opportunity", opportunity);
        detail.put("team", team);
        detail.put("competitors", competitors);
        detail.put("stageLogs", stageLogs);
        return Result.ok(detail);
    }

    @PostMapping
    public Result<Opportunity> create(@RequestBody Opportunity opportunity) {
        return Result.ok(opportunityService.create(opportunity));
    }

    @PutMapping
    public Result<Opportunity> update(@RequestBody Opportunity opportunity) {
        return Result.ok(opportunityService.update(opportunity));
    }

    @PutMapping("/{id}/stage")
    public Result<Opportunity> updateStage(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        String stage = (String) body.get("stage");
        String content = (String) body.get("content");
        return Result.ok(opportunityService.updateStage(id, stage, content));
    }

    @PostMapping("/team")
    public Result<OpportunityTeam> addTeamMember(@RequestBody Map<String, Object> body) {
        Number opportunityIdNum = (Number) body.get("opportunityId");
        Long opportunityId = opportunityIdNum.longValue();
        Number userIdNum = (Number) body.get("userId");
        Long userId = userIdNum.longValue();
        String role = (String) body.get("role");
        return Result.ok(opportunityService.addTeamMember(opportunityId, userId, role));
    }

    @DeleteMapping("/team/{id}")
    public Result<Void> removeTeamMember(@PathVariable Long id) {
        opportunityService.removeTeamMemberById(id);
        return Result.ok();
    }

    @GetMapping("/{id}/team")
    public Result<List<OpportunityTeam>> getTeam(@PathVariable Long id) {
        return Result.ok(opportunityService.getTeam(id));
    }

    @PostMapping("/competitor")
    public Result<OpportunityCompetitor> addCompetitor(@RequestBody Map<String, Object> body) {
        OpportunityCompetitor competitor = new OpportunityCompetitor();
        Number opportunityIdNum = (Number) body.get("opportunityId");
        competitor.setOpportunityId(opportunityIdNum.longValue());
        competitor.setCompetitorName((String) body.get("competitorName"));
        competitor.setStrength((String) body.get("strength"));
        competitor.setWeakness((String) body.get("weakness"));
        competitor.setOurAdvantage((String) body.get("ourAdvantage"));
        return Result.ok(opportunityService.addCompetitor(competitor));
    }

    @GetMapping("/{id}/competitors")
    public Result<List<OpportunityCompetitor>> getCompetitors(@PathVariable Long id) {
        return Result.ok(opportunityService.getCompetitors(id));
    }

    @GetMapping("/{id}/stage-logs")
    public Result<List<OpportunityStageLog>> getStageLogs(@PathVariable Long id) {
        return Result.ok(opportunityService.getStageLogs(id));
    }

    @GetMapping("/funnel")
    public Result<List<Map<String, Object>>> funnel(
            @RequestParam(required = false) Long ownerId) {
        return Result.ok(opportunityService.getFunnel(ownerId));
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        opportunityService.delete(id);
        return Result.ok();
    }
}
