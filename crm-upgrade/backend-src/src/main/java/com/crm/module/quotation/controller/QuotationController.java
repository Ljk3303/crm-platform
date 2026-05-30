package com.crm.module.quotation.controller;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.crm.common.PageResult;
import com.crm.common.Result;
import com.crm.module.quotation.entity.Order;
import com.crm.module.quotation.entity.Quotation;
import com.crm.module.quotation.entity.QuotationItem;
import com.crm.module.quotation.service.QuotationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/quotations")
@RequiredArgsConstructor
public class QuotationController {

    private final QuotationService quotationService;

    /**
     * 分页查询报价列表，支持按报价编号、客户、状态筛选
     */
    @GetMapping("/list")
    public Result<PageResult<Quotation>> list(
            @RequestParam(defaultValue = "1") long page,
            @RequestParam(defaultValue = "20") long size,
            @RequestParam(required = false) String quotationNo,
            @RequestParam(required = false) Long customerId,
            @RequestParam(required = false) Integer status) {
        IPage<Quotation> result = quotationService.list(page, size, quotationNo, customerId, status);
        return Result.ok(PageResult.of(result.getTotal(), (int) result.getCurrent(), (int) result.getSize(), result.getRecords()));
    }

    /**
     * 获取报价详情，含明细列表
     */
    @GetMapping("/{id}")
    public Result<Map<String, Object>> getById(@PathVariable Long id) {
        return Result.ok(quotationService.getDetail(id));
    }

    /**
     * 创建报价，请求体包含报价信息和明细数组
     */
    @PostMapping
    public Result<Quotation> create(@RequestBody Map<String, Object> body) {
        Quotation quotation = parseQuotation(body);
        List<QuotationItem> items = parseQuotationItems(body);
        return Result.ok(quotationService.create(quotation, items));
    }

    /**
     * 更新报价基本信息
     */
    @PutMapping
    public Result<Quotation> update(@RequestBody Quotation quotation) {
        return Result.ok(quotationService.update(quotation));
    }

    /**
     * 提交审批：状态改为待审批
     */
    @PostMapping("/{id}/submit")
    public Result<Quotation> submit(@PathVariable Long id) {
        return Result.ok(quotationService.submit(id));
    }

    /**
     * 审批通过
     */
    @PostMapping("/{id}/approve")
    public Result<Quotation> approve(@PathVariable Long id, @RequestBody Map<String, String> body) {
        return Result.ok(quotationService.approve(id, body.get("comment")));
    }

    /**
     * 审批驳回
     */
    @PostMapping("/{id}/reject")
    public Result<Quotation> reject(@PathVariable Long id, @RequestBody Map<String, String> body) {
        return Result.ok(quotationService.reject(id, body.get("comment")));
    }

    /**
     * 报价转订单：从报价数据创建销售订单
     */
    @PostMapping("/{id}/convert-to-order")
    public Result<Order> convertToOrder(@PathVariable Long id) {
        return Result.ok(quotationService.convertToOrder(id));
    }

    /**
     * 删除报价及明细
     */
    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        quotationService.delete(id);
        return Result.ok();
    }

    @SuppressWarnings("unchecked")
    private Quotation parseQuotation(Map<String, Object> body) {
        Quotation quotation = new Quotation();
        quotation.setCustomerId(toLong(body.get("customerId")));
        quotation.setContactId(toLong(body.get("contactId")));
        quotation.setOpportunityId(toLong(body.get("opportunityId")));
        quotation.setTemplateId(toLong(body.get("templateId")));
        quotation.setDescription((String) body.get("description"));
        quotation.setOwnerId(toLong(body.get("ownerId")));

        Object discountRateObj = body.get("discountRate");
        if (discountRateObj != null) {
            quotation.setDiscountRate(new java.math.BigDecimal(discountRateObj.toString()));
        }

        Object discountAmountObj = body.get("discountAmount");
        if (discountAmountObj != null) {
            quotation.setDiscountAmount(new java.math.BigDecimal(discountAmountObj.toString()));
        }

        Object taxRateObj = body.get("taxRate");
        if (taxRateObj != null) {
            quotation.setTaxRate(new java.math.BigDecimal(taxRateObj.toString()));
        }

        Object validUntilObj = body.get("validUntil");
        if (validUntilObj != null) {
            quotation.setValidUntil(java.time.LocalDate.parse(validUntilObj.toString()));
        }

        return quotation;
    }

    @SuppressWarnings("unchecked")
    private List<QuotationItem> parseQuotationItems(Map<String, Object> body) {
        Object itemsObj = body.get("items");
        if (!(itemsObj instanceof List)) {
            return List.of();
        }
        List<Map<String, Object>> itemList = (List<Map<String, Object>>) itemsObj;
        List<QuotationItem> items = new java.util.ArrayList<>();
        for (Map<String, Object> itemMap : itemList) {
            QuotationItem item = new QuotationItem();
            item.setProductId(toLong(itemMap.get("productId")));
            item.setProductName((String) itemMap.get("productName"));
            item.setSpecification((String) itemMap.get("specification"));
            item.setUnit((String) itemMap.get("unit"));
            item.setQuantity(toInt(itemMap.get("quantity")));
            Object unitPriceObj = itemMap.get("unitPrice");
            if (unitPriceObj != null) {
                item.setUnitPrice(new java.math.BigDecimal(unitPriceObj.toString()));
            }
            Object discountObj = itemMap.get("discount");
            if (discountObj != null) {
                item.setDiscount(new java.math.BigDecimal(discountObj.toString()));
            }
            item.setRemark((String) itemMap.get("remark"));
            item.setSortOrder(toInt(itemMap.get("sortOrder")));
            items.add(item);
        }
        return items;
    }

    private Long toLong(Object obj) {
        if (obj == null) return null;
        if (obj instanceof Number) return ((Number) obj).longValue();
        try {
            return Long.valueOf(obj.toString());
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private Integer toInt(Object obj) {
        if (obj == null) return null;
        if (obj instanceof Number) return ((Number) obj).intValue();
        try {
            return Integer.valueOf(obj.toString());
        } catch (NumberFormatException e) {
            return null;
        }
    }
}
