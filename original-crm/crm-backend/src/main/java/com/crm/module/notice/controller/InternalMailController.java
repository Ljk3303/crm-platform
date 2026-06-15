package com.crm.module.notice.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.crm.common.PageResult;
import com.crm.common.Result;
import com.crm.module.notice.entity.InternalMail;
import com.crm.module.notice.mapper.InternalMailMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/mails")
@RequiredArgsConstructor
public class InternalMailController {

    private final InternalMailMapper internalMailMapper;

    @GetMapping("/inbox")
    public Result<PageResult<InternalMail>> inbox(
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(defaultValue = "10") Integer size,
            @RequestParam Long userId) {
        Page<InternalMail> p = new Page<>(page, size);
        LambdaQueryWrapper<InternalMail> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(InternalMail::getReceiverId, userId).orderByDesc(InternalMail::getCreatedAt);
        p = internalMailMapper.selectPage(p, wrapper);
        return Result.ok(new PageResult(p.getTotal(), page, size, p.getRecords()));
    }

    @GetMapping("/sent")
    public Result<PageResult<InternalMail>> sent(
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(defaultValue = "10") Integer size,
            @RequestParam Long userId) {
        Page<InternalMail> p = new Page<>(page, size);
        LambdaQueryWrapper<InternalMail> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(InternalMail::getSenderId, userId).orderByDesc(InternalMail::getCreatedAt);
        p = internalMailMapper.selectPage(p, wrapper);
        return Result.ok(new PageResult(p.getTotal(), page, size, p.getRecords()));
    }

    @GetMapping("/unread-count")
    public Result<Long> unreadCount(@RequestParam Long userId) {
        LambdaQueryWrapper<InternalMail> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(InternalMail::getReceiverId, userId).eq(InternalMail::getIsRead, 0);
        return Result.ok(internalMailMapper.selectCount(wrapper));
    }

    @GetMapping("/{id}")
    public Result<InternalMail> getById(@PathVariable Long id) {
        return Result.ok(internalMailMapper.selectById(id));
    }

    @PostMapping
    public Result<InternalMail> send(@RequestBody InternalMail mail) {
        mail.setCreatedAt(LocalDateTime.now());
        internalMailMapper.insert(mail);
        return Result.ok(mail);
    }

    @PostMapping("/{id}/reply")
    public Result<InternalMail> reply(@PathVariable Long id, @RequestBody InternalMail mail) {
        InternalMail original = internalMailMapper.selectById(id);
        if (original != null) {
            mail.setParentId(id);
            mail.setCreatedAt(LocalDateTime.now());
            internalMailMapper.insert(mail);
        }
        return Result.ok(mail);
    }

    @PutMapping("/{id}/read")
    public Result<Void> markRead(@PathVariable Long id) {
        InternalMail mail = internalMailMapper.selectById(id);
        if (mail != null) {
            mail.setIsRead(1);
            internalMailMapper.updateById(mail);
        }
        return Result.ok();
    }

    @PutMapping("/{id}/star")
    public Result<Void> toggleStar(@PathVariable Long id) {
        InternalMail mail = internalMailMapper.selectById(id);
        if (mail != null) {
            mail.setIsStarred(mail.getIsStarred() != null && mail.getIsStarred() == 1 ? 0 : 1);
            internalMailMapper.updateById(mail);
        }
        return Result.ok();
    }
}
