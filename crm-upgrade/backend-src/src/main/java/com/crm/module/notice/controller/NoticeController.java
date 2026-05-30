package com.crm.module.notice.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.crm.common.PageResult;
import com.crm.common.Result;
import com.crm.module.notice.entity.Notice;
import com.crm.module.notice.entity.NoticeRead;
import com.crm.module.notice.mapper.NoticeMapper;
import com.crm.module.notice.mapper.NoticeReadMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/notices")
@RequiredArgsConstructor
public class NoticeController {

    private final NoticeMapper noticeMapper;
    private final NoticeReadMapper noticeReadMapper;

    @GetMapping("/list")
    public Result<PageResult<Notice>> list(
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(defaultValue = "10") Integer size) {
        Page<Notice> p = new Page<>(page, size);
        LambdaQueryWrapper<Notice> wrapper = new LambdaQueryWrapper<>();
        wrapper.orderByDesc(Notice::getIsTop).orderByDesc(Notice::getCreatedAt);
        p = noticeMapper.selectPage(p, wrapper);
        return Result.success(PageResult.of(p.getTotal(), page, size, p.getRecords()));
    }

    @GetMapping("/{id}")
    public Result<Notice> getById(@PathVariable Long id) {
        Notice notice = noticeMapper.selectById(id);
        if (notice != null) {
            notice.setViewCount((notice.getViewCount() == null ? 0 : notice.getViewCount()) + 1);
            noticeMapper.updateById(notice);
        }
        return Result.success(notice);
    }

    @PostMapping
    public Result<Notice> create(@RequestBody Notice notice) {
        notice.setCreatedAt(LocalDateTime.now());
        notice.setUpdatedAt(LocalDateTime.now());
        noticeMapper.insert(notice);
        return Result.success(notice);
    }

    @PutMapping
    public Result<Notice> update(@RequestBody Notice notice) {
        notice.setUpdatedAt(LocalDateTime.now());
        noticeMapper.updateById(notice);
        return Result.success(notice);
    }

    @PutMapping("/{id}/publish")
    public Result<Void> publish(@PathVariable Long id) {
        Notice notice = noticeMapper.selectById(id);
        if (notice != null) {
            notice.setStatus("PUBLISHED");
            notice.setPublishedAt(LocalDateTime.now());
            notice.setUpdatedAt(LocalDateTime.now());
            noticeMapper.updateById(notice);
        }
        return Result.success();
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        noticeMapper.deleteById(id);
        return Result.success();
    }

    @GetMapping("/unread-count")
    public Result<Long> unreadCount() {
        LambdaQueryWrapper<Notice> noticeWrapper = new LambdaQueryWrapper<>();
        noticeWrapper.eq(Notice::getStatus, "PUBLISHED");
        long total = noticeMapper.selectCount(noticeWrapper);
        LambdaQueryWrapper<NoticeRead> readWrapper = new LambdaQueryWrapper<>();
        long readCount = noticeReadMapper.selectCount(readWrapper);
        return Result.success(Math.max(0, total - readCount));
    }

    @GetMapping("/latest")
    public Result<List<Notice>> latest() {
        Page<Notice> p = new Page<>(1, 5);
        LambdaQueryWrapper<Notice> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Notice::getStatus, "PUBLISHED").orderByDesc(Notice::getCreatedAt);
        p = noticeMapper.selectPage(p, wrapper);
        return Result.success(p.getRecords());
    }
}
