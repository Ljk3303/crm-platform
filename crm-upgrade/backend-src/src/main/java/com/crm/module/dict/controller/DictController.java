package com.crm.module.dict.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.crm.common.Result;
import com.crm.module.dict.entity.SysDictData;
import com.crm.module.dict.entity.SysDictType;
import com.crm.module.dict.mapper.SysDictDataMapper;
import com.crm.module.dict.mapper.SysDictTypeMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/dict")
@RequiredArgsConstructor
public class DictController {

    private final SysDictTypeMapper dictTypeMapper;
    private final SysDictDataMapper dictDataMapper;

    @GetMapping("/types")
    public Result<List<SysDictType>> listTypes() {
        LambdaQueryWrapper<SysDictType> wrapper = new LambdaQueryWrapper<>();
        wrapper.orderByAsc(SysDictType::getDictType);
        return Result.ok(dictTypeMapper.selectList(wrapper));
    }

    @PostMapping("/types")
    public Result<SysDictType> createType(@RequestBody SysDictType dictType) {
        dictTypeMapper.insert(dictType);
        return Result.ok(dictType);
    }

    @GetMapping("/data/{dictType}")
    public Result<List<SysDictData>> listData(@PathVariable String dictType) {
        LambdaQueryWrapper<SysDictData> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(SysDictData::getDictType, dictType).orderByAsc(SysDictData::getSortOrder);
        return Result.ok(dictDataMapper.selectList(wrapper));
    }

    @PostMapping("/data")
    public Result<SysDictData> createData(@RequestBody SysDictData dictData) {
        dictDataMapper.insert(dictData);
        return Result.ok(dictData);
    }

    @PutMapping("/data")
    public Result<SysDictData> updateData(@RequestBody SysDictData dictData) {
        dictDataMapper.updateById(dictData);
        return Result.ok(dictDataMapper.selectById(dictData.getId()));
    }
}
