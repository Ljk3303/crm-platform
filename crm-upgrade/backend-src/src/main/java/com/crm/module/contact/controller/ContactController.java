package com.crm.module.contact.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.crm.common.PageResult;
import com.crm.common.Result;
import com.crm.module.contact.entity.Contact;
import com.crm.module.contact.mapper.ContactMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/contacts")
@RequiredArgsConstructor
public class ContactController {

    private final ContactMapper contactMapper;

    @GetMapping("/list")
    public Result<PageResult<Contact>> list(
            @RequestParam(defaultValue = "1") long page,
            @RequestParam(defaultValue = "20") long size,
            @RequestParam(required = false) Long customerId) {
        LambdaQueryWrapper<Contact> wrapper = new LambdaQueryWrapper<>();
        if (customerId != null) {
            wrapper.eq(Contact::getCustomerId, customerId);
        }
        wrapper.orderByDesc(Contact::getCreatedAt);
        IPage<Contact> result = contactMapper.selectPage(new Page<>(page, size), wrapper);
        return Result.ok(PageResult.of(result.getTotal(), (int) result.getCurrent(), (int) result.getSize(), result.getRecords()));
    }

    @GetMapping("/{id}")
    public Result<Contact> getById(@PathVariable Long id) {
        return Result.ok(contactMapper.selectById(id));
    }

    @PostMapping
    public Result<Contact> create(@RequestBody Contact contact) {
        contactMapper.insert(contact);
        return Result.ok(contact);
    }

    @PutMapping
    public Result<Contact> update(@RequestBody Contact contact) {
        contactMapper.updateById(contact);
        return Result.ok(contactMapper.selectById(contact.getId()));
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        contactMapper.deleteById(id);
        return Result.ok();
    }
}
