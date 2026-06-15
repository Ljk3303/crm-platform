package com.crm.module.activity.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.crm.common.PageResult;
import com.crm.common.Result;
import com.crm.module.activity.entity.ActivityExpense;
import com.crm.module.activity.entity.ActivityTarget;
import com.crm.module.activity.entity.MarketingActivity;
import com.crm.module.activity.mapper.ActivityExpenseMapper;
import com.crm.module.activity.mapper.ActivityTargetMapper;
import com.crm.module.activity.mapper.MarketingActivityMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

@Slf4j
@RestController
@RequestMapping("/api/marketing-activities")
@RequiredArgsConstructor
public class MarketingActivityController {

    private final MarketingActivityMapper activityMapper;
    private final ActivityExpenseMapper expenseMapper;
    private final ActivityTargetMapper targetMapper;

    /**
     * 分页查询营销活动列表，支持按名称、类型、状态筛选
     */
    @GetMapping("/list")
    public Result<PageResult<MarketingActivity>> list(
            @RequestParam(defaultValue = "1") long page,
            @RequestParam(defaultValue = "20") long size,
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) Integer status) {
        LambdaQueryWrapper<MarketingActivity> wrapper = new LambdaQueryWrapper<>();
        if (StringUtils.hasText(name)) {
            wrapper.like(MarketingActivity::getName, name);
        }
        if (StringUtils.hasText(type)) {
            wrapper.eq(MarketingActivity::getType, type);
        }
        if (status != null) {
            wrapper.eq(MarketingActivity::getStatus, status);
        }
        wrapper.orderByDesc(MarketingActivity::getCreatedAt);
        IPage<MarketingActivity> result = activityMapper.selectPage(new Page<>(page, size), wrapper);
        return Result.ok(new PageResult(result.getTotal(), (int) result.getCurrent(), (int) result.getSize(), result.getRecords()));
    }

    /**
     * 获取活动详情
     */
    @GetMapping("/{id}")
    public Result<MarketingActivity> getById(@PathVariable Long id) {
        MarketingActivity activity = activityMapper.selectById(id);
        if (activity == null) {
            return Result.fail("活动不存在");
        }
        return Result.ok(activity);
    }

    /**
     * 创建营销活动
     */
    @PostMapping
    public Result<MarketingActivity> create(@RequestBody MarketingActivity activity) {
        activity.setActualCost(activity.getActualCost() != null ? activity.getActualCost() : BigDecimal.ZERO);
        activity.setLeadCount(activity.getLeadCount() != null ? activity.getLeadCount() : 0);
        activity.setOpportunityCount(activity.getOpportunityCount() != null ? activity.getOpportunityCount() : 0);
        activity.setDealAmount(activity.getDealAmount() != null ? activity.getDealAmount() : BigDecimal.ZERO);
        activity.setStatus(activity.getStatus() != null ? activity.getStatus() : 0);
        activity.setCreatedAt(LocalDateTime.now());
        activity.setUpdatedAt(LocalDateTime.now());
        activityMapper.insert(activity);
        return Result.ok(activity);
    }

    /**
     * 更新营销活动
     */
    @PutMapping
    public Result<MarketingActivity> update(@RequestBody MarketingActivity activity) {
        activity.setUpdatedAt(LocalDateTime.now());
        activityMapper.updateById(activity);
        return Result.ok(activityMapper.selectById(activity.getId()));
    }

    /**
     * 删除营销活动
     */
    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        activityMapper.deleteById(id);
        return Result.ok();
    }

    /**
     * 添加活动费用
     */
    @PostMapping("/{id}/expenses")
    public Result<ActivityExpense> addExpense(@PathVariable Long id, @RequestBody ActivityExpense expense) {
        expense.setActivityId(id);
        expense.setCreatedAt(LocalDateTime.now());
        expense.setUpdatedAt(LocalDateTime.now());
        expenseMapper.insert(expense);

        // 更新活动的实际费用
        MarketingActivity activity = activityMapper.selectById(id);
        if (activity != null) {
            BigDecimal currentCost = activity.getActualCost() != null ? activity.getActualCost() : BigDecimal.ZERO;
            BigDecimal expenseAmount = expense.getAmount() != null ? expense.getAmount() : BigDecimal.ZERO;
            activity.setActualCost(currentCost.add(expenseAmount));
            activity.setUpdatedAt(LocalDateTime.now());
            activityMapper.updateById(activity);
        }

        log.info("活动 {} 添加费用: amount={}", id, expense.getAmount());
        return Result.ok(expense);
    }

    /**
     * 查询活动费用列表
     */
    @GetMapping("/{id}/expenses")
    public Result<List<ActivityExpense>> listExpenses(@PathVariable Long id) {
        LambdaQueryWrapper<ActivityExpense> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(ActivityExpense::getActivityId, id).orderByDesc(ActivityExpense::getCreatedAt);
        return Result.ok(expenseMapper.selectList(wrapper));
    }

    /**
     * 添加目标客户
     */
    @PostMapping("/{id}/targets")
    public Result<ActivityTarget> addTarget(@PathVariable Long id, @RequestBody ActivityTarget target) {
        target.setActivityId(id);
        target.setCreatedAt(LocalDateTime.now());
        targetMapper.insert(target);
        log.info("活动 {} 添加目标客户: customerId={}", id, target.getCustomerId());
        return Result.ok(target);
    }

    /**
     * 活动效果分析
     */
    @GetMapping("/{id}/analysis")
    public Result<Map<String, Object>> analysis(@PathVariable Long id) {
        MarketingActivity activity = activityMapper.selectById(id);
        if (activity == null) {
            return Result.fail("活动不存在");
        }

        // 统计目标客户数和费用
        LambdaQueryWrapper<ActivityTarget> targetWrapper = new LambdaQueryWrapper<>();
        targetWrapper.eq(ActivityTarget::getActivityId, id);
        long targetCount = targetMapper.selectCount(targetWrapper);

        LambdaQueryWrapper<ActivityExpense> expenseWrapper = new LambdaQueryWrapper<>();
        expenseWrapper.eq(ActivityExpense::getActivityId, id);
        List<ActivityExpense> expenses = expenseMapper.selectList(expenseWrapper);
        BigDecimal totalExpense = expenses.stream()
                .map(e -> e.getAmount() != null ? e.getAmount() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // 计算投资回报率
        BigDecimal roi = BigDecimal.ZERO;
        if (totalExpense.compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal dealAmount = activity.getDealAmount() != null ? activity.getDealAmount() : BigDecimal.ZERO;
            BigDecimal profit = dealAmount.subtract(totalExpense);
            roi = profit.divide(totalExpense, 4, java.math.RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100));
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("activity", activity);
        result.put("targetCustomerCount", targetCount);
        result.put("totalExpense", totalExpense);
        result.put("expenseCount", expenses.size());
        result.put("leadCount", activity.getLeadCount());
        result.put("opportunityCount", activity.getOpportunityCount());
        result.put("dealAmount", activity.getDealAmount());
        result.put("roi", roi + "%");
        result.put("conversionRate", targetCount > 0
                ? String.format("%.2f%%", (double) activity.getOpportunityCount() / targetCount * 100)
                : "0%");

        return Result.ok(result);
    }
}
