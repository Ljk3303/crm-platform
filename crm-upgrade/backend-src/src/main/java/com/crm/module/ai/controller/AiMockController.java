package com.crm.module.ai.controller;

import com.crm.common.Result;
import com.crm.module.ai.service.*;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * AI智能分析Mock控制器
 * 所有接口均为Mock逻辑实现，未来替换为DeepSeek API
 */
@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AiMockController {

    private final ChurnPredictionService churnPredictionService;
    private final MarketingCopyService marketingCopyService;
    private final SalesScriptService salesScriptService;
    private final CustomerProfileService customerProfileService;
    private final SalesAgentService salesAgentService;

    /**
     * 客户流失预警
     * GET /api/ai/churn-prediction?customerId=1
     */
    @GetMapping("/churn-prediction")
    public Result<?> predictChurn(@RequestParam Long customerId) {
        return Result.ok(churnPredictionService.predict(customerId));
    }

    /**
     * 批量客户流失风险（用于列表显示红黄绿灯）
     * GET /api/ai/churn-batch?customerIds=1,2,3
     */
    @GetMapping("/churn-batch")
    public Result<?> batchChurnPrediction(@RequestParam String customerIds) {
        return Result.ok(churnPredictionService.batchPredict(customerIds));
    }

    /**
     * 智能营销文案生成
     * POST /api/ai/marketing-copy
     * Body: { "activityTheme": "五一促销", "targetCustomerType": "高价值客户" }
     */
    @PostMapping("/marketing-copy")
    public Result<?> generateMarketingCopy(@RequestBody Map<String, String> params) {
        String theme = params.get("activityTheme");
        String customerType = params.get("targetCustomerType");
        return Result.ok(marketingCopyService.generate(theme, customerType));
    }

    /**
     * 销售话术推荐
     * GET /api/ai/sales-script?stage=需求分析&customerTags=高价值,制造业
     */
    @GetMapping("/sales-script")
    public Result<?> recommendScript(
            @RequestParam String stage,
            @RequestParam(required = false) String customerTags) {
        return Result.ok(salesScriptService.recommend(stage, customerTags));
    }

    /**
     * 客户画像总结
     * GET /api/ai/customer-profile?customerId=1
     */
    @GetMapping("/customer-profile")
    public Result<?> getCustomerProfile(@RequestParam Long customerId) {
        return Result.ok(customerProfileService.generate(customerId));
    }

    /**
     * 销售助手Agent指令
     * POST /api/ai/agent/command
     * Body: { "command": "帮我看看今天需要优先跟进的客户" }
     */
    @PostMapping("/agent/command")
    public Result<?> executeAgentCommand(@RequestBody Map<String, String> params) {
        String command = params.get("command");
        return Result.ok(salesAgentService.execute(command));
    }

    /**
     * RFM客户细分分析
     * GET /api/ai/rfm-analysis
     */
    @GetMapping("/rfm-analysis")
    public Result<?> rfmAnalysis() {
        return Result.ok(salesAgentService.rfmAnalysis());
    }

    /**
     * 销售预测
     * GET /api/ai/sales-forecast
     */
    @GetMapping("/sales-forecast")
    public Result<?> salesForecast() {
        return Result.ok(salesAgentService.salesForecast());
    }

    /**
     * 今日优先跟进Top5
     * GET /api/ai/today-priority
     */
    @GetMapping("/today-priority")
    public Result<?> todayPriority() {
        return Result.ok(salesAgentService.todayPriority());
    }
}
