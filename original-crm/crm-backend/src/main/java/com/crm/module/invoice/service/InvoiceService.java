package com.crm.module.invoice.service;

import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.crm.common.PageResult;
import com.crm.module.invoice.entity.Invoice;
import com.crm.module.invoice.mapper.InvoiceMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class InvoiceService {

    private final InvoiceMapper invoiceMapper;

    public PageResult<Invoice> list(Integer page, Integer size) {
        Page<Invoice> p = new Page<>(page, size);
        Page<Invoice> result = invoiceMapper.selectPage(p,
                Wrappers.<Invoice>lambdaQuery().orderByDesc(Invoice::getCreatedAt));
        return new PageResult(result.getTotal(), page, size, result.getRecords());
    }

    public Invoice getById(Long id) {
        return invoiceMapper.selectById(id);
    }

    @Transactional
    public Invoice create(Invoice invoice) {
        invoice.setInvoiceNo("INV" + System.currentTimeMillis());
        invoice.setApplyDate(LocalDate.now());
        invoice.setStatus("待开票");
        invoice.setCreatedAt(LocalDateTime.now());
        invoice.setUpdatedAt(LocalDateTime.now());
        invoiceMapper.insert(invoice);
        return invoice;
    }

    @Transactional
    public void issue(Long id, String invoiceNo) {
        Invoice invoice = invoiceMapper.selectById(id);
        if (invoice != null) {
            invoice.setInvoiceNo(invoiceNo);
            invoice.setIssueDate(LocalDate.now());
            invoice.setStatus("已开票");
            invoice.setUpdatedAt(LocalDateTime.now());
            invoiceMapper.updateById(invoice);
        }
    }

    @Transactional
    public void cancel(Long id) {
        Invoice invoice = invoiceMapper.selectById(id);
        if (invoice != null) {
            invoice.setStatus("已作废");
            invoice.setUpdatedAt(LocalDateTime.now());
            invoiceMapper.updateById(invoice);
        }
    }

    public List<Invoice> getByOrder(Long orderId) {
        return invoiceMapper.selectList(
                Wrappers.<Invoice>lambdaQuery()
                        .eq(Invoice::getOrderId, orderId)
                        .orderByDesc(Invoice::getCreatedAt));
    }
}
