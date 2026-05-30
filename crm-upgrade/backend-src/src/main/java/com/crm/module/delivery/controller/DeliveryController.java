package com.crm.module.delivery.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.crm.common.PageResult;
import com.crm.common.Result;
import com.crm.module.delivery.entity.Delivery;
import com.crm.module.delivery.mapper.DeliveryMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/deliveries")
@RequiredArgsConstructor
public class DeliveryController {

    private final DeliveryMapper deliveryMapper;

    @GetMapping("/list")
    public Result<PageResult<Delivery>> list(
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(defaultValue = "10") Integer size,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Long customerId) {
        Page<Delivery> p = new Page<>(page, size);
        LambdaQueryWrapper<Delivery> wrapper = new LambdaQueryWrapper<>();
        if (status != null) wrapper.eq(Delivery::getStatus, status);
        if (customerId != null) wrapper.eq(Delivery::getCustomerId, customerId);
        wrapper.orderByDesc(Delivery::getCreatedAt);
        p = deliveryMapper.selectPage(p, wrapper);
        return Result.success(PageResult.of(p.getTotal(), page, size, p.getRecords()));
    }

    @GetMapping("/{id}")
    public Result<Delivery> getById(@PathVariable Long id) {
        return Result.success(deliveryMapper.selectById(id));
    }

    @PostMapping
    public Result<Delivery> create(@RequestBody Delivery delivery) {
        delivery.setDeliveryNo("DLV-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        if (delivery.getStatus() == null) delivery.setStatus("PENDING");
        delivery.setCreatedAt(LocalDateTime.now());
        delivery.setUpdatedAt(LocalDateTime.now());
        deliveryMapper.insert(delivery);
        return Result.success(delivery);
    }

    @PutMapping("/{id}/ship")
    public Result<Void> ship(@PathVariable Long id, @RequestBody Map<String, String> body) {
        Delivery delivery = deliveryMapper.selectById(id);
        if (delivery != null) {
            delivery.setCarrier(body.get("carrier"));
            delivery.setTrackingNo(body.get("trackingNo"));
            delivery.setStatus("SHIPPED");
            delivery.setUpdatedAt(LocalDateTime.now());
            deliveryMapper.updateById(delivery);
        }
        return Result.success();
    }

    @PutMapping("/{id}/sign")
    public Result<Void> sign(@PathVariable Long id) {
        Delivery delivery = deliveryMapper.selectById(id);
        if (delivery != null) {
            delivery.setStatus("SIGNED");
            delivery.setUpdatedAt(LocalDateTime.now());
            deliveryMapper.updateById(delivery);
        }
        return Result.success();
    }

    @GetMapping("/order/{orderId}")
    public Result<List<Delivery>> getByOrder(@PathVariable Long orderId) {
        LambdaQueryWrapper<Delivery> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Delivery::getOrderId, orderId).orderByDesc(Delivery::getCreatedAt);
        return Result.success(deliveryMapper.selectList(wrapper));
    }
}
