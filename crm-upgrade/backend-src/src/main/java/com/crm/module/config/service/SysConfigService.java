package com.crm.module.config.service;

import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.crm.module.config.entity.SysConfig;
import com.crm.module.config.mapper.SysConfigMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class SysConfigService {

    private final SysConfigMapper sysConfigMapper;

    public List<SysConfig> list() {
        return sysConfigMapper.selectList(Wrappers.<SysConfig>lambdaQuery().orderByAsc(SysConfig::getId));
    }

    public SysConfig getByKey(String key) {
        return sysConfigMapper.selectOne(
                Wrappers.<SysConfig>lambdaQuery().eq(SysConfig::getConfigKey, key));
    }

    @Transactional
    public SysConfig update(SysConfig config) {
        SysConfig existing = getByKey(config.getConfigKey());
        if (existing != null) {
            existing.setConfigValue(config.getConfigValue());
            existing.setUpdatedAt(LocalDateTime.now());
            sysConfigMapper.updateById(existing);
            return existing;
        }
        config.setCreatedAt(LocalDateTime.now());
        config.setUpdatedAt(LocalDateTime.now());
        sysConfigMapper.insert(config);
        return config;
    }
}
