package com.crm.module.salesteam.service;

import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.crm.module.salesteam.entity.SalesTeam;
import com.crm.module.salesteam.entity.SalesTeamMember;
import com.crm.module.salesteam.mapper.SalesTeamMapper;
import com.crm.module.salesteam.mapper.SalesTeamMemberMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class SalesTeamService {

    private final SalesTeamMapper salesTeamMapper;
    private final SalesTeamMemberMapper salesTeamMemberMapper;

    public List<SalesTeam> list() {
        return salesTeamMapper.selectList(Wrappers.<SalesTeam>lambdaQuery().eq(SalesTeam::getStatus, 1));
    }

    public SalesTeam getById(Long id) {
        SalesTeam team = salesTeamMapper.selectById(id);
        if (team != null) {
            List<SalesTeamMember> members = salesTeamMemberMapper.selectList(
                    Wrappers.<SalesTeamMember>lambdaQuery().eq(SalesTeamMember::getTeamId, id));
        }
        return team;
    }

    public List<SalesTeamMember> getMembers(Long teamId) {
        return salesTeamMemberMapper.selectList(
                Wrappers.<SalesTeamMember>lambdaQuery().eq(SalesTeamMember::getTeamId, teamId));
    }

    @Transactional
    public SalesTeam create(SalesTeam team) {
        team.setStatus(1);
        team.setCreatedAt(LocalDateTime.now());
        team.setUpdatedAt(LocalDateTime.now());
        salesTeamMapper.insert(team);
        return team;
    }

    @Transactional
    public SalesTeam update(SalesTeam team) {
        team.setUpdatedAt(LocalDateTime.now());
        salesTeamMapper.updateById(team);
        return team;
    }

    @Transactional
    public void delete(Long id) {
        salesTeamMapper.deleteById(id);
        salesTeamMemberMapper.delete(
                Wrappers.<SalesTeamMember>lambdaQuery().eq(SalesTeamMember::getTeamId, id));
    }

    @Transactional
    public SalesTeamMember addMember(Long teamId, Long userId, String role) {
        SalesTeamMember member = new SalesTeamMember();
        member.setTeamId(teamId);
        member.setUserId(userId);
        member.setRole(role != null ? role : "member");
        member.setCreatedAt(LocalDateTime.now());
        salesTeamMemberMapper.insert(member);
        return member;
    }

    @Transactional
    public void removeMember(Long teamId, Long userId) {
        salesTeamMemberMapper.delete(
                Wrappers.<SalesTeamMember>lambdaQuery()
                        .eq(SalesTeamMember::getTeamId, teamId)
                        .eq(SalesTeamMember::getUserId, userId));
    }
}
