package com.crm.module.invoice.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.crm.common.PageResult;
import com.crm.common.Result;
import com.crm.module.invoice.entity.Invoice;
import com.crm.module.invoice.mapper.InvoiceMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/invoices")
@RequiredArgsConstructor
public class InvoiceController {

    private final InvoiceMapper invoiceMapper;

    @GetMapping("/list")
    public Result<PageResult<Invoice>> list(
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(defaultValue = "10") Integer size,
            @RequestParam(required = false) Long customerId,
            @RequestParam(required = false) String status) {
        Page<Invoice> p = new Page<>(page, size);
        LambdaQueryWrapper<Invoice> wrapper = new LambdaQueryWrapper<>();
        if (customerId != null) wrapper.eq(Invoice::getCustomerId, customerId);
        if (status != null) wrapper.eq(Invoice::getStatus, status);
        wrapper.orderByDesc(Invoice::getCreatedAt);
        p = invoiceMapper.selectPage(p, wrapper);
        return Result.success(PageResult.of(p.getTotal(), page, size, p.getRecords()));
    }

    @GetMapping("/{id}")
    public Result<Invoice> getById(@PathVariable Long id) {
        return Result.success(invoiceMapper.selectById(id));
    }

    @PostMapping
    public Result<Invoice> create(@RequestBody Invoice invoice) {
        invoice.setStatus("DRAFT");
        invoice.setApplyDate(LocalDate.now());
        invoice.setCreatedAt(LocalDateTime.now());
        invoice.setUpdatedAt(LocalDateTime.now());
        invoiceMapper.insert(invoice);
        return Result.success(invoice);
    }

    @PutMapping("/{id}/issue")
    public Result<Void> issue(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        Invoice invoice = invoiceMapper.selectById(id);
        if (invoice != null) {
            invoice.setInvoiceNo((String) body.get("invoiceNo"));
            String issueDate = (String) body.get("issueDate");
            if (issueDate != null) {
                invoice.setIssueDate(LocalDate.parse(issueDate));
            } else {
                invoice.setIssueDate(LocalDate.now());
            }
            invoice.setStatus("ISSUED");
            invoice.setUpdatedAt(LocalDateTime.now());
            invoiceMapper.updateById(invoice);
        }
        return Result.success();
    }

    @PutMapping("/{id}/cancel")
    public Result<Void> cancel(@PathVariable Long id) {
        Invoice invoice = invoiceMapper.selectById(id);
        if (invoice != null) {
            invoice.setStatus("CANCELLED");
            invoice.setUpdatedAt(LocalDateTime.now());
            invoiceMapper.updateById(invoice);
        }
        return Result.success();
    }

    @GetMapping("/order/{orderId}")
    public Result<List<Invoice>> getByOrder(@PathVariable Long orderId) {
        LambdaQueryWrapper<Invoice> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Invoice::getOrderId, orderId).orderByDesc(Invoice::getCreatedAt);
        return Result.success(invoiceMapper.selectList(wrapper));
    }
}
