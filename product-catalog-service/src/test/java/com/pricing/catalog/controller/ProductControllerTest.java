package com.pricing.catalog.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.pricing.catalog.dto.CreateProductRequest;
import com.pricing.catalog.exception.ProductNotFoundException;
import com.pricing.catalog.model.Product;
import com.pricing.catalog.model.ProductStatus;
import com.pricing.catalog.service.ProductService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(ProductController.class)
class ProductControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @MockBean  ProductService productService;

    @Test
    void postProduct_returns201WithProduct() throws Exception {
        var req = new CreateProductRequest("Widget", "A widget", "Electronics",
                new BigDecimal("99.99"), 100, List.of());
        var product = Product.builder()
                .productId("abc-123")
                .name("Widget")
                .basePrice(new BigDecimal("99.99"))
                .currentPrice(new BigDecimal("99.99"))
                .status(ProductStatus.ACTIVE)
                .build();

        when(productService.createProduct(any())).thenReturn(product);

        mockMvc.perform(post("/api/products")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.productId").value("abc-123"))
                .andExpect(jsonPath("$.currentPrice").value(99.99));
    }

    @Test
    void postProduct_returns400OnMissingName() throws Exception {
        var req = new CreateProductRequest("", "desc", "cat", new BigDecimal("10"), 5, null);

        mockMvc.perform(post("/api/products")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void getProduct_returns404WhenNotFound() throws Exception {
        when(productService.getProductById("missing"))
                .thenThrow(new ProductNotFoundException("missing"));

        mockMvc.perform(get("/api/products/missing"))
                .andExpect(status().isNotFound());
    }

    @Test
    void getProducts_returnsListFilteredByCategory() throws Exception {
        var product = Product.builder().productId("p1").category("Electronics").build();
        when(productService.getProducts("Electronics")).thenReturn(List.of(product));

        mockMvc.perform(get("/api/products?category=Electronics"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].productId").value("p1"));
    }

    @Test
    void deleteProduct_returns204() throws Exception {
        mockMvc.perform(delete("/api/products/p1"))
                .andExpect(status().isNoContent());
    }
}
