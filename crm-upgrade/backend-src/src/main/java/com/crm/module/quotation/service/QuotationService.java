package com.crm.module.quotation.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.crm.module.quotation.entity.Order;
import com.crm.module.quotation.entity.OrderItem;
import com.crm.module.quotation.entity.Quotation;
import com.crm.module.quotation.entity.QuotationItem;
import com.crm.module.quotation.mapper.OrderItemMapper;
import com.crm.module.quotation.mapper.OrderMapper;
import com.crm.module.quotation.mapper.QuotationItemMapper;
import com.crm.module.quotation.mapper.QuotationMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class QuotationService {

    private final QuotationMapper quotationMapper;
    private final QuotationItemMapper quotationItemMapper;
    private final OrderMapper orderMapper;
    private final OrderItemMapper orderItemMapper;

    /**
     * 分页查询报价列表，支持按报价编号、客户、状态筛选
     */
    public IPage<Quotation> list(long page, long size, String quotationNo, Long customerId, Integer status) {
        LambdaQueryWrapper<Quotation> wrapper = new LambdaQueryWrapper<>();
        if (StringUtils.hasText(quotationNo)) {
            wrapper.like(Quotation::getQuotationNo, quotationNo);
        }
        if (customerId != null) {
            wrapper.eq(Quotation::getCustomerId, customerId);
        }
        if (status != null) {
            wrapper.eq(Quotation::getStatus, status);
        }
        wrapper.orderByDesc(Quotation::getCreatedAt);
        return quotationMapper.selectPage(new Page<>(page, size), wrapper);
    }

    /**
     * 获取报价详情，含明细列表
     */
    public Map<String, Object> getDetail(Long id) {
        Quotation quotation = quotationMapper.selectById(id);
        if (quotation == null) {
            throw new RuntimeException("报价不存在");
        }
        List<QuotationItem> items = getItems(id);
        Map<String, Object> detail = new LinkedHashMap<>();
        detail.put("quotation", quotation);
        detail.put("items", items);
        return detail;
    }

    /**
     * 获取报价的明细项
     */
    public List<QuotationItem> getItems(Long quotationId) {
        LambdaQueryWrapper<QuotationItem> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(QuotationItem::getQuotationId, quotationId).orderByAsc(QuotationItem::getSortOrder);
        return quotationItemMapper.selectList(wrapper);
    }

    /**
     * 创建报价，同时批量保存明细并计算总额
     */
    @Transactional
    public Quotation create(Quotation quotation, List<QuotationItem> items) {
        // 计算总额
        BigDecimal totalAmount = BigDecimal.ZERO;
        if (items != null && !items.isEmpty()) {
            for (QuotationItem item : items) {
                if (item.getUnitPrice() != null && item.getQuantity() != null) {
                    BigDecimal lineAmount = item.getUnitPrice().multiply(BigDecimal.valueOf(item.getQuantity()));
                    if (item.getDiscount() != null && item.getDiscount().compareTo(BigDecimal.ZERO) > 0) {
                        lineAmount = lineAmount.subtract(item.getDiscount());
                    }
                    item.setAmount(lineAmount);
                    totalAmount = totalAmount.add(lineAmount);
                }
            }
        }

        // 计算折扣后金额
        BigDecimal discountAmount = quotation.getDiscountAmount() != null ? quotation.getDiscountAmount() : BigDecimal.ZERO;
        BigDecimal afterDiscount = totalAmount.subtract(discountAmount);

        // 计算税额
        BigDecimal taxRate = quotation.getTaxRate() != null ? quotation.getTaxRate() : BigDecimal.ZERO;
        BigDecimal taxAmount = afterDiscount.multiply(taxRate);

        // 最终金额
        BigDecimal finalAmount = afterDiscount.add(taxAmount);

        // 生成报价编号
        String quotationNo = generateQuotationNo();
        quotation.setQuotationNo(quotationNo);
        quotation.setTotalAmount(totalAmount);
        quotation.setDiscountAmount(discountAmount);
        quotation.setTaxAmount(taxAmount);
        quotation.setFinalAmount(finalAmount);
        quotation.setStatus(0); // 0=草稿
        quotation.setCreatedAt(LocalDateTime.now());
        quotation.setUpdatedAt(LocalDateTime.now());
        quotationMapper.insert(quotation);

        // 批量保存明细
        if (items != null && !items.isEmpty()) {
            int sort = 1;
            for (QuotationItem item : items) {
                item.setQuotationId(quotation.getId());
                item.setSortOrder(item.getSortOrder() != null ? item.getSortOrder() : sort++);
                item.setCreatedAt(LocalDateTime.now());
                quotationItemMapper.insert(item);
            }
        }

        log.info("创建报价成功: quotationNo={}, totalAmount={}, finalAmount={}", quotationNo, totalAmount, finalAmount);
        return quotation;
    }

    /**
     * 更新报价基本信息
     */
    @Transactional
    public Quotation update(Quotation quotation) {
        quotation.setUpdatedAt(LocalDateTime.now());
        quotationMapper.updateById(quotation);
        return quotationMapper.selectById(quotation.getId());
    }

    /**
     * 删除报价及明细
     */
    @Transactional
    public void delete(Long id) {
        LambdaQueryWrapper<QuotationItem> itemWrapper = new LambdaQueryWrapper<>();
        itemWrapper.eq(QuotationItem::getQuotationId, id);
        quotationItemMapper.delete(itemWrapper);
        quotationMapper.deleteById(id);
        log.info("删除报价成功: id={}", id);
    }

    /**
     * 提交审批：状态改为"待审批"
     */
    @Transactional
    public Quotation submit(Long id) {
        Quotation quotation = quotationMapper.selectById(id);
        if (quotation == null) {
            throw new RuntimeException("报价不存在");
        }
        if (quotation.getStatus() != null && quotation.getStatus() == 1) {
            throw new RuntimeException("报价已在审批中");
        }
        quotation.setStatus(1); // 1=待审批
        quotation.setUpdatedAt(LocalDateTime.now());
        quotationMapper.updateById(quotation);
        log.info("报价已提交审批: id={}", id);
        return quotation;
    }

    /**
     * 审批通过
     */
    @Transactional
    public Quotation approve(Long id, String comment) {
        Quotation quotation = quotationMapper.selectById(id);
        if (quotation == null) {
            throw new RuntimeException("报价不存在");
        }
        if (quotation.getStatus() == null || quotation.getStatus() != 1) {
            throw new RuntimeException("报价不在待审批状态");
        }
        quotation.setStatus(2); // 2=已通过
        quotation.setUpdatedAt(LocalDateTime.now());
        quotationMapper.updateById(quotation);
        log.info("报价审批通过: id={}, comment={}", id, comment);
        return quotation;
    }

    /**
     * 审批驳回
     */
    @Transactional
    public Quotation reject(Long id, String comment) {
        Quotation quotation = quotationMapper.selectById(id);
        if (quotation == null) {
            throw new RuntimeException("报价不存在");
        }
        if (quotation.getStatus() == null || quotation.getStatus() != 1) {
            throw new RuntimeException("报价不在待审批状态");
        }
        quotation.setStatus(3); // 3=已驳回
        quotation.setUpdatedAt(LocalDateTime.now());
        quotationMapper.updateById(quotation);
        log.info("报价审批驳回: id={}, comment={}", id, comment);
        return quotation;
    }

    /**
     * 报价转订单：从报价数据创建销售订单和订单明细
     */
    @Transactional
    public Order convertToOrder(Long quotationId) {
        Quotation quotation = quotationMapper.selectById(quotationId);
        if (quotation == null) {
            throw new RuntimeException("报价不存在");
        }
        if (quotation.getStatus() == null || quotation.getStatus() != 2) {
            throw new RuntimeException("报价未审批通过，无法转订单");
        }
        if (quotation.getOrderId() != null) {
            throw new RuntimeException("报价已生成订单");
        }

        // 获取报价明细
        List<QuotationItem> quotationItems = getItems(quotationId);

        // 创建订单
        Order order = new Order();
        order.setOrderNo(generateOrderNo());
        order.setCustomerId(quotation.getCustomerId());
        order.setContactId(quotation.getContactId());
        order.setQuotationId(quotationId);
        order.setTotalAmount(quotation.getTotalAmount());
        order.setDiscountAmount(quotation.getDiscountAmount());
        order.setTaxAmount(quotation.getTaxAmount());
        order.setFinalAmount(quotation.getFinalAmount());
        order.setDeliveryDate(quotation.getValidUntil());
        order.setDescription(quotation.getDescription());
        order.setOwnerId(quotation.getOwnerId());
        order.setStatus(1); // 1=待处理
        order.setCreatedAt(LocalDateTime.now());
        order.setUpdatedAt(LocalDateTime.now());
        orderMapper.insert(order);

        // 创建订单明细
        if (quotationItems != null && !quotationItems.isEmpty()) {
            for (QuotationItem qi : quotationItems) {
                OrderItem orderItem = new OrderItem();
                orderItem.setOrderId(order.getId());
                orderItem.setProductId(qi.getProductId());
                orderItem.setProductName(qi.getProductName());
                orderItem.setSpecification(qi.getSpecification());
                orderItem.setUnit(qi.getUnit());
                orderItem.setQuantity(qi.getQuantity());
                orderItem.setUnitPrice(qi.getUnitPrice());
                orderItem.setAmount(qi.getAmount());
                orderItem.setDiscount(qi.getDiscount());
                orderItem.setRemark(qi.getRemark());
                orderItem.setSortOrder(qi.getSortOrder());
                orderItem.setCreatedAt(LocalDateTime.now());
                orderItemMapper.insert(orderItem);
            }
        }

        // 更新报价状态和关联订单
        quotation.setStatus(4); // 4=已转换
        quotation.setOrderId(order.getId());
        quotation.setUpdatedAt(LocalDateTime.now());
        quotationMapper.updateById(quotation);

        log.info("报价转订单成功: quotationId={}, orderId={}, orderNo={}", quotationId, order.getId(), order.getOrderNo());
        return order;
    }

    /**
     * 生成报价编号: Q + 年月日 + 4位随机数
     */
    private String generateQuotationNo() {
        String date = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        String random = String.format("%04d", new Random().nextInt(10000));
        return "Q" + date + random;
    }

    /**
     * 生成订单编号: SO + 年月日 + 4位随机数
     */
    private String generateOrderNo() {
        String date = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        String random = String.format("%04d", new Random().nextInt(10000));
        return "SO" + date + random;
    }
}
