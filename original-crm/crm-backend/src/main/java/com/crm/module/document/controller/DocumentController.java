package com.crm.module.document.controller;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.crm.common.PageResult;
import com.crm.common.Result;
import com.crm.module.document.entity.Document;
import com.crm.module.document.mapper.DocumentMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.time.LocalDateTime;
import java.util.UUID;

@RestController
@RequestMapping("/api/documents")
@RequiredArgsConstructor
public class DocumentController {

    private final DocumentMapper documentMapper;

    private static final String UPLOAD_DIR = "uploads/";

    @GetMapping("/list")
    public Result<PageResult<Document>> list(
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(defaultValue = "10") Integer size,
            @RequestParam(required = false) String relatedType,
            @RequestParam(required = false) Long relatedId) {
        Page<Document> p = new Page<>(page, size);
        com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper<Document> wrapper =
                new com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper<>();
        if (relatedType != null) wrapper.eq(Document::getRelatedType, relatedType);
        if (relatedId != null) wrapper.eq(Document::getRelatedId, relatedId);
        wrapper.orderByDesc(Document::getCreatedAt);
        p = documentMapper.selectPage(p, wrapper);
        return Result.ok(new PageResult(p.getTotal(), page, size, p.getRecords()));
    }

    @PostMapping("/upload")
    public Result<Document> upload(
            @RequestParam("file") MultipartFile file,
            @RequestParam(required = false) String relatedType,
            @RequestParam(required = false) Long relatedId) {
        if (file.isEmpty()) {
            return Result.fail("文件不能为空");
        }
        try {
            File dir = new File(UPLOAD_DIR);
            if (!dir.exists()) dir.mkdirs();
            String fileName = UUID.randomUUID().toString() + "_" + file.getOriginalFilename();
            File dest = new File(UPLOAD_DIR + fileName);
            file.transferTo(dest);

            Document doc = new Document();
            doc.setName(file.getOriginalFilename());
            doc.setFilePath(UPLOAD_DIR + fileName);
            doc.setFileSize(file.getSize());
            doc.setFileType(getFileType(file.getOriginalFilename()));
            doc.setRelatedType(relatedType);
            doc.setRelatedId(relatedId);
            doc.setDownloadCount(0);
            doc.setStatus(1);
            doc.setCreatedAt(LocalDateTime.now());
            doc.setUpdatedAt(LocalDateTime.now());
            documentMapper.insert(doc);
            return Result.ok(doc);
        } catch (IOException e) {
            return Result.fail("文件上传失败: " + e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        Document doc = documentMapper.selectById(id);
        if (doc != null) {
            File file = new File(doc.getFilePath());
            if (file.exists()) file.delete();
            documentMapper.deleteById(id);
        }
        return Result.ok();
    }

    private String getFileType(String fileName) {
        if (fileName == null) return "unknown";
        int dot = fileName.lastIndexOf('.');
        return dot > 0 ? fileName.substring(dot + 1).toLowerCase() : "unknown";
    }
}
