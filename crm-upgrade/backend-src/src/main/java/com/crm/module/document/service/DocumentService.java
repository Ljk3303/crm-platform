package com.crm.module.document.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.crm.common.PageResult;
import com.crm.module.document.entity.Document;
import com.crm.module.document.mapper.DocumentMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class DocumentService {

    private final DocumentMapper documentMapper;

    public PageResult<Document> list(Integer page, Integer size, String category, String relatedType, Long relatedId) {
        Page<Document> p = new Page<>(page, size);
        LambdaQueryWrapper<Document> wrapper = Wrappers.lambdaQuery();
        if (StringUtils.hasText(category)) wrapper.eq(Document::getCategory, category);
        if (StringUtils.hasText(relatedType)) wrapper.eq(Document::getRelatedType, relatedType);
        if (relatedId != null) wrapper.eq(Document::getRelatedId, relatedId);
        wrapper.orderByDesc(Document::getCreatedAt);
        Page<Document> result = documentMapper.selectPage(p, wrapper);
        return PageResult.of(result.getTotal(), page, size, result.getRecords());
    }

    @Transactional
    public Document upload(Document document) {
        document.setDownloadCount(0);
        document.setStatus(1);
        document.setCreatedAt(LocalDateTime.now());
        document.setUpdatedAt(LocalDateTime.now());
        documentMapper.insert(document);
        return document;
    }

    public Document getById(Long id) {
        Document doc = documentMapper.selectById(id);
        if (doc != null) {
            doc.setDownloadCount(doc.getDownloadCount() == null ? 1 : doc.getDownloadCount() + 1);
            documentMapper.updateById(doc);
        }
        return doc;
    }

    @Transactional
    public void delete(Long id) {
        documentMapper.deleteById(id);
    }
}
