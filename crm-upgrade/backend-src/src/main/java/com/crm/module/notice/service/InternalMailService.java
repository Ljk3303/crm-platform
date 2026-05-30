package com.crm.module.notice.service;

import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.crm.common.PageResult;
import com.crm.module.notice.entity.InternalMail;
import com.crm.module.notice.mapper.InternalMailMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class InternalMailService {

    private final InternalMailMapper internalMailMapper;

    public PageResult<InternalMail> inbox(Long userId, Integer page, Integer size) {
        Page<InternalMail> p = new Page<>(page, size);
        Page<InternalMail> result = internalMailMapper.selectPage(p,
                Wrappers.<InternalMail>lambdaQuery()
                        .eq(InternalMail::getReceiverId, userId)
                        .orderByDesc(InternalMail::getCreatedAt));
        return PageResult.of(result.getTotal(), page, size, result.getRecords());
    }

    public PageResult<InternalMail> sent(Long userId, Integer page, Integer size) {
        Page<InternalMail> p = new Page<>(page, size);
        Page<InternalMail> result = internalMailMapper.selectPage(p,
                Wrappers.<InternalMail>lambdaQuery()
                        .eq(InternalMail::getSenderId, userId)
                        .orderByDesc(InternalMail::getCreatedAt));
        return PageResult.of(result.getTotal(), page, size, result.getRecords());
    }

    public Long getUnreadCount(Long userId) {
        return internalMailMapper.selectCount(
                Wrappers.<InternalMail>lambdaQuery()
                        .eq(InternalMail::getReceiverId, userId)
                        .eq(InternalMail::getIsRead, 0));
    }

    public InternalMail getById(Long id) {
        return internalMailMapper.selectById(id);
    }

    @Transactional
    public InternalMail send(InternalMail mail) {
        mail.setIsRead(0);
        mail.setIsStarred(0);
        mail.setCreatedAt(LocalDateTime.now());
        internalMailMapper.insert(mail);
        return mail;
    }

    @Transactional
    public InternalMail reply(Long parentId, InternalMail mail) {
        InternalMail parent = internalMailMapper.selectById(parentId);
        if (parent != null) {
            mail.setParentId(parentId);
            mail.setReceiverId(parent.getSenderId());
            mail.setSenderId(parent.getReceiverId());
            mail.setTitle("Re: " + parent.getTitle());
        }
        mail.setIsRead(0);
        mail.setIsStarred(0);
        mail.setCreatedAt(LocalDateTime.now());
        internalMailMapper.insert(mail);
        return mail;
    }

    @Transactional
    public void markRead(Long id) {
        InternalMail mail = internalMailMapper.selectById(id);
        if (mail != null) {
            mail.setIsRead(1);
            internalMailMapper.updateById(mail);
        }
    }

    @Transactional
    public void toggleStar(Long id) {
        InternalMail mail = internalMailMapper.selectById(id);
        if (mail != null) {
            mail.setIsStarred(mail.getIsStarred() == 1 ? 0 : 1);
            internalMailMapper.updateById(mail);
        }
    }
}
