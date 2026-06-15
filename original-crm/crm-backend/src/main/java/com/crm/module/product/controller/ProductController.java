package com.crm.module.product.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.crm.common.PageResult;
import com.crm.common.Result;
import com.crm.module.product.entity.Product;
import com.crm.module.product.entity.ProductPrice;
import com.crm.module.product.mapper.ProductMapper;
import com.crm.module.product.mapper.ProductPriceMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductMapper productMapper;
    private final ProductPriceMapper productPriceMapper;

    @GetMapping("/list")
    public Result<PageResult<Product>> list(
            @RequestParam(defaultValue = "1") long page,
            @RequestParam(defaultValue = "20") long size,
            @RequestParam(required = false) String code,
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String category) {
        LambdaQueryWrapper<Product> wrapper = new LambdaQueryWrapper<>();
        if (StringUtils.hasText(code)) {
            wrapper.like(Product::getCode, code);
        }
        if (StringUtils.hasText(name)) {
            wrapper.like(Product::getName, name);
        }
        if (StringUtils.hasText(category)) {
            wrapper.eq(Product::getCategory, category);
        }
        wrapper.orderByDesc(Product::getCreatedAt);
        IPage<Product> result = productMapper.selectPage(new Page<>(page, size), wrapper);
        return Result.ok(new PageResult(result.getTotal(), (int) result.getCurrent(), (int) result.getSize(), result.getRecords()));
    }

    @GetMapping("/{id}")
    public Result<Product> getById(@PathVariable Long id) {
        return Result.ok(productMapper.selectById(id));
    }

    @PostMapping
    public Result<Product> create(@RequestBody Product product) {
        productMapper.insert(product);
        return Result.ok(product);
    }

    @PutMapping
    public Result<Product> update(@RequestBody Product product) {
        productMapper.updateById(product);
        return Result.ok(productMapper.selectById(product.getId()));
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        productMapper.deleteById(id);
        return Result.ok();
    }

    @GetMapping("/prices/{productId}")
    public Result<List<ProductPrice>> getPrices(@PathVariable Long productId) {
        LambdaQueryWrapper<ProductPrice> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(ProductPrice::getProductId, productId);
        return Result.ok(productPriceMapper.selectList(wrapper));
    }
}
