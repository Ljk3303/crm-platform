package com.crm.module.share.controller;

import com.crm.common.Result;
import com.crm.module.share.entity.CustomerShare;
import com.crm.module.share.service.CustomerExtendService;
import com.crm.module.tag.entity.CustomerTag;
import com.crm.module.tag.entity.CustomerTagRel;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/customers-extend")
@RequiredArgsConstructor
public class CustomerExtendController {

    private final CustomerExtendService customerExtendService;

    @PostMapping("/assign")
    public Result<Void> assign(@RequestBody Map<String, Long> params) {
        customerExtendService.assignCustomer(params.get("customerId"), params.get("userId"));
        return Result.ok();
    }

    @PostMapping("/reclaim")
    public Result<Void> reclaim(@RequestBody Map<String, List<Long>> params) {
        customerExtendService.reclaimCustomers(params.get("customerIds"));
        return Result.ok();
    }

    @PostMapping("/merge")
    public Result<Void> merge(@RequestBody Map<String, Long> params) {
        customerExtendService.mergeCustomers(params.get("sourceId"), params.get("targetId"));
        return Result.ok();
    }

    @PostMapping("/share")
    public Result<CustomerShare> share(@RequestBody Map<String, Object> params) {
        Long customerId = Long.valueOf(params.get("customerId").toString());
        Long fromUserId = Long.valueOf(params.get("fromUserId").toString());
        Long toUserId = Long.valueOf(params.get("toUserId").toString());
        String permission = (String) params.getOrDefault("permission", "只读");
        return Result.ok(customerExtendService.shareCustomer(customerId, fromUserId, toUserId, permission));
    }

    @DeleteMapping("/share/{id}")
    public Result<Void> removeShare(@PathVariable Long id) {
        customerExtendService.removeShare(id);
        return Result.ok();
    }

    @GetMapping("/tags/{customerId}")
    public Result<List<CustomerTag>> getTags(@PathVariable Long customerId) {
        return Result.ok(customerExtendService.getCustomerTags(customerId));
    }

    @PostMapping("/tags")
    public Result<CustomerTagRel> addTag(@RequestBody Map<String, Long> params) {
        return Result.ok(customerExtendService.addCustomerTag(params.get("customerId"), params.get("tagId")));
    }

    @DeleteMapping("/tags/{relId}")
    public Result<Void> removeTag(@PathVariable Long relId) {
        customerExtendService.removeCustomerTag(relId);
        return Result.ok();
    }

    @GetMapping("/pool/auto-reclaim")
    public Result<List<Long>> autoReclaim() {
        return Result.ok(customerExtendService.autoReclaim());
    }
}
