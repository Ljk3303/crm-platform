package com.crm.common;

import lombok.Data;
import java.util.List;

@Data
public class PageResult<T> {

    private long total;
    private int page;
    private int size;
    private List<T> records;

    private PageResult(long total, int page, int size, List<T> records) {
        this.total = total;
        this.page = page;
        this.size = size;
        this.records = records;
    }

    public static <T> PageResult<T> of(long total, int page, int size, List<T> records) {
        return new PageResult<>(total, page, size, records);
    }
}
