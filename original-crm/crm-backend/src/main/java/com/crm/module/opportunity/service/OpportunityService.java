package com.crm.module.opportunity.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.crm.module.opportunity.entity.*;
import com.crm.module.opportunity.mapper.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * 商机管理服务
 * 商机阶段: 初步接触→需求分析→方案报价→谈判→赢单/输单
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class OpportunityService {

    private final OpportunityMapper opportunityMapper;
    private final OpportunityTeamMapper teamMapper;
    private final OpportunityCompetitorMapper competitorMapper;
    private final OpportunityStageLogMapper stageLogMapper;

    /**
     * 分页查询商机列表，支持按名称、阶段、客户ID筛选
     */
    public IPage<Opportunity> list(long page, long size, String name, String stage, Long customerId) {
        LambdaQueryWrapper<Opportunity> wrapper = new LambdaQueryWrapper<>();
        if (StringUtils.hasText(name)) {
            wrapper.like(Opportunity::getName, name);
        }
        if (StringUtils.hasText(stage)) {
            wrapper.eq(Opportunity::getStage, stage);
        }
        if (customerId != null) {
            wrapper.eq(Opportunity::getCustomerId, customerId);
        }
        wrapper.orderByDesc(Opportunity::getCreatedAt);
        return opportunityMapper.selectPage(new Page<>(page, size), wrapper);
    }

    /**
     * 按ID查询商机详情
     */
    public Opportunity getById(Long id) {
        Opportunity opportunity = opportunityMapper.selectById(id);
        if (opportunity == null) {
            throw new RuntimeException("商机不存在");
        }
        return opportunity;
    }

    /**
     * 创建商机
     */
    public Opportunity create(Opportunity opportunity) {
        if (opportunity.getStage() == null) {
            opportunity.setStage("初步接触");
            opportunity.setStageOrder(1);
        }
        if (opportunity.getProbability() == null) {
            opportunity.setProbability(10);
        }
        opportunity.setCreatedAt(LocalDateTime.now());
        opportunity.setUpdatedAt(LocalDateTime.now());
        opportunityMapper.insert(opportunity);
        log.info("创建商机: id={}, name={}", opportunity.getId(), opportunity.getName());
        return opportunity;
    }

    /**
     * 更新商机
     */
    public Opportunity update(Opportunity opportunity) {
        Opportunity existing = opportunityMapper.selectById(opportunity.getId());
        if (existing == null) {
            throw new RuntimeException("商机不存在");
        }
        opportunity.setUpdatedAt(LocalDateTime.now());
        opportunityMapper.updateById(opportunity);
        return opportunityMapper.selectById(opportunity.getId());
    }

    /**
     * 更新商机阶段，并记录阶段变更日志
     */
    @Transactional
    public Opportunity updateStage(Long opportunityId, String newStage, String content) {
        Opportunity opportunity = opportunityMapper.selectById(opportunityId);
        if (opportunity == null) {
            throw new RuntimeException("商机不存在");
        }

        String oldStage = opportunity.getStage();

        // 记录阶段变更日志
        OpportunityStageLog stageLog = new OpportunityStageLog();
        stageLog.setOpportunityId(opportunityId);
        stageLog.setFromStage(oldStage);
        stageLog.setToStage(newStage);
        stageLog.setContent(content);
        stageLog.setCreatedAt(LocalDateTime.now());
        stageLogMapper.insert(stageLog);

        // 更新商机阶段
        opportunity.setStage(newStage);
        opportunity.setStageOrder(getStageOrder(newStage));
        // 赢单/输单时更新概率
        if ("赢单".equals(newStage)) {
            opportunity.setProbability(100);
        } else if ("输单".equals(newStage)) {
            opportunity.setProbability(0);
        }
        opportunity.setUpdatedAt(LocalDateTime.now());
        opportunityMapper.updateById(opportunity);

        log.info("商机阶段变更: id={}, {} → {}", opportunityId, oldStage, newStage);
        return opportunityMapper.selectById(opportunityId);
    }

    /**
     * 获取阶段顺序号
     */
    private int getStageOrder(String stage) {
        switch (stage) {
            case "初步接触": return 1;
            case "需求分析": return 2;
            case "方案报价": return 3;
            case "谈判": return 4;
            case "赢单": return 5;
            case "输单": return 6;
            default: return 99;
        }
    }

    /**
     * 添加商机团队成员
     */
    public OpportunityTeam addTeamMember(Long opportunityId, Long userId, String role) {
        // 检查商机是否存在
        Opportunity opportunity = opportunityMapper.selectById(opportunityId);
        if (opportunity == null) {
            throw new RuntimeException("商机不存在");
        }

        // 检查是否已在团队中
        LambdaQueryWrapper<OpportunityTeam> checkWrapper = new LambdaQueryWrapper<>();
        checkWrapper.eq(OpportunityTeam::getOpportunityId, opportunityId)
                     .eq(OpportunityTeam::getUserId, userId);
        OpportunityTeam existing = teamMapper.selectOne(checkWrapper);
        if (existing != null) {
            throw new RuntimeException("该成员已在团队中");
        }

        OpportunityTeam team = new OpportunityTeam();
        team.setOpportunityId(opportunityId);
        team.setUserId(userId);
        team.setRole(role);
        team.setCreatedAt(LocalDateTime.now());
        teamMapper.insert(team);
        log.info("添加商机团队成员: opportunityId={}, userId={}, role={}", opportunityId, userId, role);
        return team;
    }

    /**
     * 按团队成员记录ID删除
     */
    public void removeTeamMemberById(Long teamId) {
        OpportunityTeam team = teamMapper.selectById(teamId);
        if (team == null) {
            throw new RuntimeException("团队成员记录不存在");
        }
        teamMapper.deleteById(teamId);
        log.info("移除商机团队成员: id={}", teamId);
    }

    /**
     * 查询商机团队成员列表
     */
    public List<OpportunityTeam> getTeam(Long opportunityId) {
        LambdaQueryWrapper<OpportunityTeam> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(OpportunityTeam::getOpportunityId, opportunityId);
        return teamMapper.selectList(wrapper);
    }

    /**
     * 添加竞争对手
     */
    public OpportunityCompetitor addCompetitor(OpportunityCompetitor competitor) {
        Opportunity opportunity = opportunityMapper.selectById(competitor.getOpportunityId());
        if (opportunity == null) {
            throw new RuntimeException("商机不存在");
        }
        competitor.setCreatedAt(LocalDateTime.now());
        competitorMapper.insert(competitor);
        log.info("添加竞争对手: opportunityId={}, competitorName={}", competitor.getOpportunityId(), competitor.getCompetitorName());
        return competitor;
    }

    /**
     * 查询商机竞争对手列表
     */
    public List<OpportunityCompetitor> getCompetitors(Long opportunityId) {
        LambdaQueryWrapper<OpportunityCompetitor> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(OpportunityCompetitor::getOpportunityId, opportunityId);
        return competitorMapper.selectList(wrapper);
    }

    /**
     * 查询商机阶段变更日志
     */
    public List<OpportunityStageLog> getStageLogs(Long opportunityId) {
        LambdaQueryWrapper<OpportunityStageLog> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(OpportunityStageLog::getOpportunityId, opportunityId)
               .orderByDesc(OpportunityStageLog::getCreatedAt);
        return stageLogMapper.selectList(wrapper);
    }

    /**
     * 删除商机
     */
    @Transactional
    public void delete(Long id) {
        Opportunity opportunity = opportunityMapper.selectById(id);
        if (opportunity == null) {
            throw new RuntimeException("商机不存在");
        }

        // 删除关联的团队成员
        LambdaQueryWrapper<OpportunityTeam> teamWrapper = new LambdaQueryWrapper<>();
        teamWrapper.eq(OpportunityTeam::getOpportunityId, id);
        teamMapper.delete(teamWrapper);

        // 删除关联的竞争对手
        LambdaQueryWrapper<OpportunityCompetitor> competitorWrapper = new LambdaQueryWrapper<>();
        competitorWrapper.eq(OpportunityCompetitor::getOpportunityId, id);
        competitorMapper.delete(competitorWrapper);

        // 删除关联的阶段日志
        LambdaQueryWrapper<OpportunityStageLog> stageLogWrapper = new LambdaQueryWrapper<>();
        stageLogWrapper.eq(OpportunityStageLog::getOpportunityId, id);
        stageLogMapper.delete(stageLogWrapper);

        // 删除商机
        opportunityMapper.deleteById(id);
        log.info("删除商机: id={}", id);
    }

    /**
     * 商机漏斗数据：按阶段分组统计数量和金额
     * 返回: [{stage, stageOrder, count, totalAmount}]
     */
    public List<Map<String, Object>> getFunnel(Long ownerId) {
        LambdaQueryWrapper<Opportunity> wrapper = new LambdaQueryWrapper<>();
        if (ownerId != null) {
            wrapper.eq(Opportunity::getOwnerId, ownerId);
        }
        // 排除已输单的商机
        wrapper.ne(Opportunity::getStage, "输单");
        List<Opportunity> opportunities = opportunityMapper.selectList(wrapper);

        // 定义漏斗阶段及顺序
        String[] stageNames = {"初步接触", "需求分析", "方案报价", "谈判", "赢单"};

        // 先按阶段分组
        Map<String, List<Opportunity>> grouped = opportunities.stream()
                .collect(Collectors.groupingBy(
                        o -> o.getStage() != null ? o.getStage() : "未知",
                        LinkedHashMap::new,
                        Collectors.toList()
                ));

        List<Map<String, Object>> funnel = new ArrayList<>();
        for (int i = 0; i < stageNames.length; i++) {
            String stage = stageNames[i];
            List<Opportunity> stageOpps = grouped.getOrDefault(stage, Collections.emptyList());

            Map<String, Object> data = new LinkedHashMap<>();
            data.put("stage", stage);
            data.put("stageOrder", i + 1);
            data.put("count", stageOpps.size());
            data.put("totalAmount", stageOpps.stream()
                    .map(o -> o.getAmount() != null ? o.getAmount() : BigDecimal.ZERO)
                    .reduce(BigDecimal.ZERO, BigDecimal::add));
            funnel.add(data);
        }

        return funnel;
    }
}
