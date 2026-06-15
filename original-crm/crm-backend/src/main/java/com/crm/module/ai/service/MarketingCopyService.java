package com.crm.module.ai.service;

// Mock逻辑，未来替换为DeepSeek API

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.crm.module.customer.entity.Customer;
import com.crm.module.customer.mapper.CustomerMapper;
import com.crm.module.product.entity.Product;
import com.crm.module.product.mapper.ProductMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MarketingCopyService {

    private final CustomerMapper customerMapper;
    private final ProductMapper productMapper;

    /**
     * 智能生成营销文案
     */
    public List<Map<String, String>> generate(String activityTheme, String targetCustomerType) {
        // 查询匹配客户类型的样布客户
        LambdaQueryWrapper<Customer> customerWrapper = new LambdaQueryWrapper<>();
        if (targetCustomerType != null && !targetCustomerType.isEmpty()) {
            customerWrapper.eq(Customer::getLevel, targetCustomerType);
        }
        customerWrapper.last("LIMIT 5");
        List<Customer> customers = customerMapper.selectList(customerWrapper);

        List<String> customerNames = new ArrayList<>();
        if (customers != null && !customers.isEmpty()) {
            customerNames = customers.stream()
                    .map(c -> c.getName() != null ? c.getName() : "")
                    .filter(n -> !n.isEmpty())
                    .collect(Collectors.toList());
        }
        if (customerNames.isEmpty()) {
            customerNames.add("尊敬的客户");
        }

        // 查询样布产品
        LambdaQueryWrapper<Product> productWrapper = new LambdaQueryWrapper<>();
        productWrapper.eq(Product::getStatus, 1)
                      .last("LIMIT 5");
        List<Product> products = productMapper.selectList(productWrapper);

        List<String> productNames = new ArrayList<>();
        if (products != null && !products.isEmpty()) {
            productNames = products.stream()
                    .map(p -> p.getName() != null ? p.getName() : "")
                    .filter(n -> !n.isEmpty())
                    .collect(Collectors.toList());
        }
        String productText;
        if (productNames.isEmpty()) {
            productText = "我们的精选产品";
        } else if (productNames.size() == 1) {
            productText = productNames.get(0);
        } else {
            productText = String.join("、", productNames.subList(0, Math.min(3, productNames.size())));
        }

        String theme = activityTheme != null ? activityTheme : "近期活动";
        String sampleName = customerNames.get(0);

        List<Map<String, String>> copies = new ArrayList<>();

        // 1. 温情版
        Map<String, String> warm = new LinkedHashMap<>();
        warm.put("style", "温情版");
        warm.put("title", "感恩相伴，致" + sampleName + "的专属心意");
        warm.put("content", "亲爱的" + sampleName + "：\n\n"
                + "感谢您一直以来对我们的信任与支持。在这个特别的「" + theme + "」活动期间，"
                + "我们为您精心准备了专属礼遇。\n\n"
                + "作为我们的" + (targetCustomerType != null ? targetCustomerType : "尊贵") + "客户，"
                + "您将优先体验" + productText + "等优质产品的最新升级服务。\n\n"
                + "我们始终相信，真诚的关怀胜过千言万语。期待与您继续携手同行，共创美好未来。");
        copies.add(warm);

        // 2. 专业版
        Map<String, String> professional = new LinkedHashMap<>();
        professional.put("style", "专业版");
        professional.put("title", "「" + theme + "」——数据驱动，精准赋能企业增长");
        professional.put("content", "尊敬的" + sampleName + "：\n\n"
                + "基于对" + (targetCustomerType != null ? targetCustomerType + "群体" : "客户") + "的深度数据分析，"
                + "我们为您量身定制了「" + theme + "」专属方案：\n\n"
                + "核心优势：\n"
                + "1. " + productText + "系列产品年度最优方案，已为超过200家同类客户带来平均23%的效率提升\n"
                + "2. 专业团队1对1服务，从需求诊断到方案落地全程护航\n"
                + "3. 售后保障体系全覆盖，7x24小时技术支持\n\n"
                + "点击了解更多专业方案详情，让数据驱动您的业务增长。");
        copies.add(professional);

        // 3. 促销版
        Map<String, String> promotional = new LinkedHashMap<>();
        promotional.put("style", "促销版");
        promotional.put("title", "限时专享！" + theme + "特惠，错过再等一年");
        promotional.put("content", sampleName + "，您有新的专属福利待领取！\n\n"
                + "" + theme + "超级特惠正式开启：\n\n"
                + "> " + productText + "等全系列产品限时8折，最高立省5000元\n"
                + "> 前100名下单加赠豪华礼包\n"
                + "> 老客户专享折上折，再享12期免息分期\n\n"
                + "限时3天，手慢无！\n"
                + "马上抢购，锁定您的专属优惠。");
        copies.add(promotional);

        return copies;
    }
}
