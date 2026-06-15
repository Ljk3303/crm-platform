package com.crm.module.ai.service;

// Mock逻辑，未来替换为DeepSeek API

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
@RequiredArgsConstructor
public class SalesScriptService {

    private static final Map<String, List<Map<String, String>>> STAGE_SCRIPTS = new LinkedHashMap<>();

    static {
        // 初步接触
        List<Map<String, String>> contactScripts = new ArrayList<>();
        Map<String, String> contact1 = new LinkedHashMap<>();
        contact1.put("title", "初次电话拜访话术");
        contact1.put("content", "您好，请问是{客户姓名}总吗？我是{公司名}的{销售姓名}。"
                + "了解到贵公司在{行业}领域做得非常出色，我们近期为{同类客户名}提供了{核心产品}解决方案，"
                + "帮助他们提升了{收益点}。想和您约个时间简单聊15分钟，看看是否有合作的机会？");
        contactScripts.add(contact1);

        Map<String, String> contact2 = new LinkedHashMap<>();
        contact2.put("title", "微信初次触达话术");
        contact2.put("content", "{客户姓名}总您好，冒昧打扰。我是{公司名}的{销售姓名}，"
                + "专注服务{行业}企业。看到贵公司最近在{关注点}方面发展很快，"
                + "我们在这方面有成功案例，不知是否方便交流一下？附上公司简介和案例资料供您参考。");
        contactScripts.add(contact2);

        Map<String, String> contact3 = new LinkedHashMap<>();
        contact3.put("title", "展会/活动邀约话术");
        contact3.put("content", "{客户姓名}总您好！我们下周三在{地点}举办一场{行业}数字化转型沙龙，"
                + "邀请了{行业大咖}分享实战经验。特意为您留了名额，不知您是否有兴趣参加？"
                + "现场也可以深度体验我们的{产品名称}。");
        contactScripts.add(contact3);

        STAGE_SCRIPTS.put("初步接触", contactScripts);

        // 需求分析
        List<Map<String, String>> analysisScripts = new ArrayList<>();
        Map<String, String> analysis1 = new LinkedHashMap<>();
        analysis1.put("title", "需求挖掘提问框架");
        analysis1.put("content", "感谢{客户姓名}总抽出时间。为了更好地帮您解决问题，我想了解几个方面：\n"
                + "1. 目前贵公司在{业务环节}主要面临哪些挑战？\n"
                + "2. 现有的解决方案有哪些不满意的地方？\n"
                + "3. 如果有一个理想方案，最重要的三个标准是什么？\n"
                + "4. 这个项目的时间规划和预算范围大概是什么样的？");
        analysisScripts.add(analysis1);

        Map<String, String> analysis2 = new LinkedHashMap<>();
        analysis2.put("title", "痛点共鸣话术");
        analysis2.put("content", "{客户姓名}总，您刚才提到的{痛点}问题，我们之前服务过的{同类客户名}也遇到过。"
                + "他们当时的情况是{具体场景描述}，通过我们的{产品/方案}，在{时间段}内实现了{量化成果}。"
                + "我觉得这个经验对贵公司应该很有参考价值。");
        analysisScripts.add(analysis2);

        STAGE_SCRIPTS.put("需求分析", analysisScripts);

        // 方案报价
        List<Map<String, String>> proposalScripts = new ArrayList<>();
        Map<String, String> proposal1 = new LinkedHashMap<>();
        proposal1.put("title", "方案呈现话术");
        proposal1.put("content", "{客户姓名}总，基于我们前期的深入沟通，团队为您定制了专属解决方案。\n\n"
                + "方案核心亮点：\n"
                + "1. {亮点一}：针对性解决您提到的{痛点}\n"
                + "2. {亮点二}：预估可带来{量化收益}\n"
                + "3. {亮点三}：分阶段实施，风险可控\n\n"
                + "投资回报周期约{ROI周期}，我们很多客户在{更短时间}内就收回了成本。");
        proposalScripts.add(proposal1);

        Map<String, String> proposal2 = new LinkedHashMap<>();
        proposal2.put("title", "报价引导话术");
        proposal2.put("content", "关于投资方面，我们的方案总价是{金额}万，包含{服务内容}。\n\n"
                + "这个价格在市场上属于中等偏上，但我们的附加值远高于竞品：\n"
                + "- {差异化价值一}\n"
                + "- {差异化价值二}\n"
                + "- {差异化价值三}\n\n"
                + "另外，这个月正好有{优惠政策}，可以帮您再节省{节省金额}。");
        proposalScripts.add(proposal2);

        Map<String, String> proposal3 = new LinkedHashMap<>();
        proposal3.put("title", "异议处理话术");
        proposal3.put("content", "我完全理解您觉得价格偏高的顾虑。其实很多客户一开始也有同样的感受。"
                + "不过我们算一笔账：您现在每年在{问题}上损失约{损失金额}，"
                + "而我们的方案投入仅{我方报价}，一年就能帮您挽回{挽回金额}。\n\n"
                + "换个角度看，这不仅是支出，更是一笔高回报的投资。");
        proposalScripts.add(proposal3);

        STAGE_SCRIPTS.put("方案报价", proposalScripts);

        // 谈判
        List<Map<String, String>> negotiationScripts = new ArrayList<>();
        Map<String, String> nego1 = new LinkedHashMap<>();
        nego1.put("title", "价格谈判策略话术");
        nego1.put("content", "{客户姓名}总，我理解价格对您很重要。不过我想确认一下，"
                + "如果我们能在{交付时间/付款方式/增值服务}方面给您更好的条件，"
                + "价格方面是否可以按照方案的报价来执行？\n\n"
                + "其实我们的价值主要体现在{核心价值}，这是竞品无法提供的。");
        negotiationScripts.add(nego1);

        Map<String, String> nego2 = new LinkedHashMap<>();
        nego2.put("title", "推动决策话术");
        nego2.put("content", "{客户姓名}总，现在正是一个非常好的时机：\n"
                + "1. 本月有{限时优惠}活动\n"
                + "2. 实施团队下个月档期比较充裕\n"
                + "3. 赶在{Q季度/年底}之前上线，正好赶上{业务高峰期}\n\n"
                + "如果能在本周内确定，我可以帮您争取{额外优惠/增值服务}。您看怎么样？");
        negotiationScripts.add(nego2);

        STAGE_SCRIPTS.put("谈判", negotiationScripts);

        // 赢单
        List<Map<String, String>> winScripts = new ArrayList<>();
        Map<String, String> win1 = new LinkedHashMap<>();
        win1.put("title", "赢单确认&感谢话术");
        win1.put("content", "{客户姓名}总，非常感谢您对我们的信任！合同已经收到，"
                + "我们会立即启动项目筹备。接下来一周内，项目经理会与您对接详细实施计划。\n\n"
                + "合作过程中有任何问题，请随时联系我。期待与您一起实现{项目目标}！");
        winScripts.add(win1);

        Map<String, String> win2 = new LinkedHashMap<>();
        win2.put("title", "交叉销售/升级推荐话术");
        win2.put("content", "恭喜{客户姓名}总！说起来，我们的{关联产品}与您刚采购的{产品}配合使用效果特别好，"
                + "很多客户反馈整体效率提升了{百分比}。要不要了解一下？我可以安排一次免费演示。");
        winScripts.add(win2);

        STAGE_SCRIPTS.put("赢单", winScripts);

        // 输单
        List<Map<String, String>> lossScripts = new ArrayList<>();
        Map<String, String> loss1 = new LinkedHashMap<>();
        loss1.put("title", "输单复盘&保持联系话术");
        loss1.put("content", "{客户姓名}总，虽然这次没能合作，但我们非常尊重您的决定。"
                + "方便透露一下最终选择了哪家供应商吗？也帮助我们持续改进。\n\n"
                + "不管怎样，希望以后还有合作机会。我会持续关注行业动态，有对您有价值的信息也会第一时间分享。");
        lossScripts.add(loss1);

        Map<String, String> loss2 = new LinkedHashMap<>();
        loss2.put("title", "输单挽回话术");
        loss2.put("content", "{客户姓名}总，理解您已经有了决定。不过我想最后补充一点："
                + "如果是因为{价格/功能/服务}的原因，我们近期刚好有{新政策/新功能/服务升级}，"
                + "是否能再给我们一次沟通的机会？哪怕只是作为备选，也希望能保持联系。");
        lossScripts.add(loss2);

        STAGE_SCRIPTS.put("输单", lossScripts);
    }

    /**
     * 根据销售阶段推荐话术
     */
    public List<Map<String, String>> recommend(String stage, String customerTags) {
        List<Map<String, String>> scripts = STAGE_SCRIPTS.getOrDefault(stage, Collections.emptyList());

        if (scripts.isEmpty()) {
            Map<String, String> defaultScript = new LinkedHashMap<>();
            defaultScript.put("title", "通用销售话术");
            defaultScript.put("content", "当前阶段暂无语术模板，建议根据客户具体情况灵活沟通。");
            scripts = Collections.singletonList(defaultScript);
        }

        // 如果有客户标签，进行话术定制
        if (customerTags != null && !customerTags.isEmpty()) {
            String[] tags = customerTags.split(",");
            List<Map<String, String>> customized = new ArrayList<>();
            for (Map<String, String> script : scripts) {
                Map<String, String> custom = new LinkedHashMap<>(script);
                String content = script.get("content");

                // 根据标签替换占位符
                StringBuilder tagInfo = new StringBuilder();
                for (String tag : tags) {
                    String trimmed = tag.trim();
                    if (!trimmed.isEmpty()) {
                        if (tagInfo.length() > 0) tagInfo.append("、");
                        tagInfo.append(trimmed);
                    }
                }

                // 在话术末尾添加标签相关信息
                if (tagInfo.length() > 0) {
                    content = content + "\n\n【针对" + tagInfo + "客户的个性化建议】\n"
                            + "基于客户画像，建议在沟通中突出与" + tagInfo + "相关的产品价值点和成功案例。";
                }

                custom.put("content", content);
                customized.add(custom);
            }
            scripts = customized;
        }

        return scripts;
    }
}
