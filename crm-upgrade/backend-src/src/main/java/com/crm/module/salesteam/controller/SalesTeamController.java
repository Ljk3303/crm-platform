package com.crm.module.salesteam.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.crm.common.PageResult;
import com.crm.common.Result;
import com.crm.module.salesteam.entity.SalesTeam;
import com.crm.module.salesteam.entity.SalesTeamMember;
import com.crm.module.salesteam.mapper.SalesTeamMapper;
import com.crm.module.salesteam.mapper.SalesTeamMemberMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/sales-teams")
@RequiredArgsConstructor
public class SalesTeamController {

    private final SalesTeamMapper salesTeamMapper;
    private final SalesTeamMemberMapper salesTeamMemberMapper;

    @GetMapping("/list")
    public Result<PageResult<SalesTeam>> list(
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(defaultValue = "10") Integer size) {
        Page<SalesTeam> p = new Page<>(page, size);
        LambdaQueryWrapper<SalesTeam> wrapper = new LambdaQueryWrapper<>();
        wrapper.orderByDesc(SalesTeam::getCreatedAt);
        p = salesTeamMapper.selectPage(p, wrapper);
        return Result.success(PageResult.of(p.getTotal(), page, size, p.getRecords()));
    }

    @GetMapping("/{id}")
    public Result<SalesTeam> getById(@PathVariable Long id) {
        return Result.success(salesTeamMapper.selectById(id));
    }

    @PostMapping
    public Result<SalesTeam> create(@RequestBody SalesTeam team) {
        team.setCreatedAt(LocalDateTime.now());
        team.setUpdatedAt(LocalDateTime.now());
        salesTeamMapper.insert(team);
        return Result.success(team);
    }

    @PutMapping
    public Result<SalesTeam> update(@RequestBody SalesTeam team) {
        team.setUpdatedAt(LocalDateTime.now());
        salesTeamMapper.updateById(team);
        return Result.success(team);
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        LambdaQueryWrapper<SalesTeamMember> memberWrapper = new LambdaQueryWrapper<>();
        memberWrapper.eq(SalesTeamMember::getTeamId, id);
        salesTeamMemberMapper.delete(memberWrapper);
        salesTeamMapper.deleteById(id);
        return Result.success();
    }

    @PostMapping("/{id}/members")
    public Result<SalesTeamMember> addMember(@PathVariable Long id, @RequestBody SalesTeamMember member) {
        member.setTeamId(id);
        member.setCreatedAt(LocalDateTime.now());
        salesTeamMemberMapper.insert(member);
        return Result.success(member);
    }

    @DeleteMapping("/{id}/members/{userId}")
    public Result<Void> removeMember(@PathVariable Long id, @PathVariable Long userId) {
        LambdaQueryWrapper<SalesTeamMember> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(SalesTeamMember::getTeamId, id).eq(SalesTeamMember::getUserId, userId);
        salesTeamMemberMapper.delete(wrapper);
        return Result.success();
    }
}
