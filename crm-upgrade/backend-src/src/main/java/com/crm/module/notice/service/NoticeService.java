package com.crm.module.notice.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.crm.common.PageResult;
import com.crm.module.notice.entity.Notice;
import com.crm.module.notice.entity.NoticeRead;
import com.crm.module.notice.mapper.NoticeMapper;
import com.crm.module.notice.mapper.NoticeReadMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class NoticeService {

    private final NoticeMapper noticeMapper;
    private final NoticeReadMapper noticeReadMapper;

    public PageResult<Notice> list(Integer page, Integer size, String keyword) {
        Page<Notice> p = new Page<>(page, size);
        LambdaQueryWrapper<Notice> wrapper = Wrappers.lambdaQuery();
        if (StringUtils.hasText(keyword)) {
            wrapper.like(Notice::getTitle, keyword).or().like(Notice::getContent, keyword);
        }
        wrapper.orderByDesc(Notice::getIsTop, Notice::getPublishedAt);
        Page<Notice> result = noticeMapper.selectPage(p, wrapper);
        return PageResult.of(result.getTotal(), page, size, result.getRecords());
    }

    public Notice getById(Long id) {
        Notice notice = noticeMapper.selectById(id);
        if (notice != null) {
            notice.setViewCount(notice.getViewCount() == null ? 1 : notice.getViewCount() + 1);
            noticeMapper.updateById(notice);
        }
        return notice;
    }

    @Transactional
    public Notice create(Notice notice) {
        notice.setStatus("草稿");
        notice.setViewCount(0);
        notice.setCreatedAt(LocalDateTime.now());
        notice.setUpdatedAt(LocalDateTime.now());
        noticeMapper.insert(notice);
        return notice;
    }

    @Transactional
    public Notice update(Notice notice) {
        notice.setUpdatedAt(LocalDateTime.now());
        noticeMapper.updateById(notice);
        return notice;
    }

    @Transactional
    public void publish(Long id) {
        Notice notice = noticeMapper.selectById(id);
        if (notice != null) {
            notice.setStatus("已发布");
            notice.setPublishedAt(LocalDateTime.now());
            notice.setUpdatedAt(LocalDateTime.now());
            noticeMapper.updateById(notice);
        }
    }

    @Transactional
    public void delete(Long id) {
        noticeMapper.deleteById(id);
    }

    public Long getUnreadCount(Long userId) {
        long totalPublished = noticeMapper.selectCount(
                Wrappers.<Notice>lambdaQuery().eq(Notice::getStatus, "已发布"));
        long readCount = noticeReadMapper.selectCount(
                Wrappers.<NoticeRead>lambdaQuery().eq(NoticeRead::getUserId, userId));
        return Math.max(0, totalPublished - readCount);
    }

    public List<Notice> getLatest() {
        return noticeMapper.selectList(
                Wrappers.<Notice>lambdaQuery()
                        .eq(Notice::getStatus, "已发布")
                        .orderByDesc(Notice::getPublishedAt)
                        .last("LIMIT 5"));
    }
}
