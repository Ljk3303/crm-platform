package com.crm.module.delivery.service;

import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.crm.common.PageResult;
import com.crm.module.delivery.entity.Delivery;
import com.crm.module.delivery.entity.DeliveryItem;
import com.crm.module.delivery.mapper.DeliveryItemMapper;
import com.crm.module.delivery.mapper.DeliveryMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DeliveryService {

    private final DeliveryMapper deliveryMapper;
    private final DeliveryItemMapper deliveryItemMapper;

    public PageResult<Delivery> list(Integer page, Integer size) {
        Page<Delivery> p = new Page<>(page, size);
        Page<Delivery> result = deliveryMapper.selectPage(p,
                Wrappers.<Delivery>lambdaQuery().orderByDesc(Delivery::getCreatedAt));
        return new PageResult(result.getTotal(), page, size, result.getRecords());
    }

    public Delivery getById(Long id) {
        Delivery delivery = deliveryMapper.selectById(id);
        if (delivery != null) {
            List<DeliveryItem> items = deliveryItemMapper.selectList(
                    Wrappers.<DeliveryItem>lambdaQuery().eq(DeliveryItem::getDeliveryId, id));
        }
        return delivery;
    }

    public List<DeliveryItem> getItems(Long deliveryId) {
        return deliveryItemMapper.selectList(
                Wrappers.<DeliveryItem>lambdaQuery().eq(DeliveryItem::getDeliveryId, deliveryId));
    }

    @Transactional
    public Delivery createFromOrder(Long orderId, Delivery delivery) {
        delivery.setDeliveryNo("DL" + System.currentTimeMillis());
        delivery.setOrderId(orderId);
        delivery.setStatus("待发货");
        delivery.setCreatedAt(LocalDateTime.now());
        delivery.setUpdatedAt(LocalDateTime.now());
        deliveryMapper.insert(delivery);
        return delivery;
    }

    @Transactional
    public void ship(Long id, String carrier, String trackingNo) {
        Delivery delivery = deliveryMapper.selectById(id);
        if (delivery != null) {
            delivery.setStatus("已发货");
            delivery.setCarrier(carrier);
            delivery.setTrackingNo(trackingNo);
            delivery.setDeliveryDate(LocalDate.now());
            delivery.setUpdatedAt(LocalDateTime.now());
            deliveryMapper.updateById(delivery);
        }
    }

    @Transactional
    public void sign(Long id) {
        Delivery delivery = deliveryMapper.selectById(id);
        if (delivery != null) {
            delivery.setStatus("已签收");
            delivery.setUpdatedAt(LocalDateTime.now());
            deliveryMapper.updateById(delivery);
        }
    }

    public Delivery getByOrder(Long orderId) {
        return deliveryMapper.selectOne(
                Wrappers.<Delivery>lambdaQuery().eq(Delivery::getOrderId, orderId));
    }
}
