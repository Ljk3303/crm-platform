package com.crm.module.config.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.crm.common.Result;
import com.crm.module.config.entity.SysConfig;
import com.crm.module.config.mapper.SysConfigMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/sys-config")
@RequiredArgsConstructor
public class SysConfigController {

    private final SysConfigMapper sysConfigMapper;

    @GetMapping("/list")
    public Result<List<SysConfig>> list() {
        return Result.ok(sysConfigMapper.selectList(null));
    }

    @GetMapping("/{key}")
    public Result<SysConfig> getByKey(@PathVariable String key) {
        LambdaQueryWrapper<SysConfig> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(SysConfig::getConfigKey, key);
        return Result.ok(sysConfigMapper.selectOne(wrapper));
    }

    @PutMapping
    public Result<SysConfig> update(@RequestBody Map<String, String> body) {
        LambdaQueryWrapper<SysConfig> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(SysConfig::getConfigKey, body.get("configKey"));
        SysConfig config = sysConfigMapper.selectOne(wrapper);
        if (config != null) {
            config.setConfigValue(body.get("configValue"));
            config.setUpdatedAt(LocalDateTime.now());
            sysConfigMapper.updateById(config);
            return Result.ok(config);
        }
        // 如果不存在则新建
        SysConfig newConfig = new SysConfig();
        newConfig.setConfigKey(body.get("configKey"));
        newConfig.setConfigValue(body.get("configValue"));
        newConfig.setCreatedAt(LocalDateTime.now());
        newConfig.setUpdatedAt(LocalDateTime.now());
        sysConfigMapper.insert(newConfig);
        return Result.ok(newConfig);
    }
}
